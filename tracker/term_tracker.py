#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
term_tracker.py — 把 Kahoot / Wayground / Gimkit / Wordwall 的匯出檔
合併,依「術語ID」回推每個術語的班級正確率與個人掌握度。

用法:
  1) 先看某個匯出檔長什麼樣(不確定欄位時一定先跑這個):
       python term_tracker.py inspect 某個匯出檔.xlsx
  2) 跑分析:
       python term_tracker.py run --exports ./exports --out ./報表

目錄約定:
  exports/kahoot/*.xlsx      Kahoot 遊戲報表
  exports/wayground/*.csv    Wayground session 匯出
  exports/gimkit/*.csv       Gimkit assignment 報表
  exports/wordwall/*.csv     Wordwall 結果

依賴: pandas openpyxl  (pip install pandas openpyxl)
"""
import sys, os, re, glob, argparse, unicodedata
import pandas as pd

GLOSSARY = "../glossary_ids.csv"
QBANK    = "../W01_題庫_主檔.csv"      # 可放多週,見 load_qbank()

# ---------------------------------------------------------------- utils
def norm(s):
    """題目文字正規化:全形→半形、去空白、去標點,提高比對命中率。"""
    if s is None: return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = re.sub(r"\s+", "", s)
    s = re.sub(r"[「」『』\"'（）()【】\[\]、,,。.?？!！:：;;~～\-—_]", "", s)
    return s.lower()

BAD_TOKENS = ("number", "no.", "num", "id", "index", "count", "order")

def pick(cols, *cands, exclude=BAD_TOKENS):
    """在欄位名裡找最合適的欄。順序: 完全相同 → 開頭相符 → 包含。
    含有 number/id/index 這類字樣的欄會被排除,避免把
    'Question Number' 誤認成 'Question'(這個 bug 真的發生過)。"""
    low = {c: str(c).strip().lower() for c in cols}
    def usable(lc, cand):
        return not any(b in lc for b in exclude if b not in cand.lower())
    for test in (lambda lc, c: lc == c,
                 lambda lc, c: lc.startswith(c),
                 lambda lc, c: c in lc):
        for cand in cands:
            cl = cand.lower()
            for col, lc in low.items():
                if test(lc, cl) and usable(lc, cl):
                    return col
    return None

def truthy_correct(v):
    """各平台把『答對』寫成各種樣子,統一成 bool。"""
    if pd.isna(v): return None
    s = str(v).strip().lower()
    if s in ("1","true","correct","yes","y","right","t"): return True
    if s in ("0","false","incorrect","no","n","wrong","f"): return False
    try:  # 有些平台給分數
        return float(s) > 0
    except ValueError:
        return None

# ---------------------------------------------------------------- loaders
def load_glossary(path):
    g = pd.read_csv(path, encoding="utf-8-sig", dtype=str).fillna("")
    return g

def load_qbank(paths):
    """題庫可以有很多份(每週一份)。必要欄位: term_id, question"""
    frames = []
    for p in paths:
        if os.path.exists(p):
            frames.append(pd.read_csv(p, encoding="utf-8-sig", dtype=str))
    if not frames:
        sys.exit("找不到題庫主檔。請確認 W01_題庫_主檔.csv 的路徑。")
    qb = pd.concat(frames, ignore_index=True).fillna("")
    qb["qkey"] = qb["question"].map(norm)
    dup = qb[qb.duplicated("qkey", keep=False)]
    if len(dup):
        print(f"⚠ 題庫有 {dup['qkey'].nunique()} 組題目文字重複,會導致 ID 對不準:")
        for k in dup["qkey"].unique()[:5]:
            print("   ", dup[dup.qkey==k]["question"].iloc[0][:40], "→", list(dup[dup.qkey==k]["term_id"]))
    return qb

# ---------------------------------------------------------------- adapters
# 每個 adapter 回傳統一 schema: student, question, correct(bool)
def adapt_kahoot(path):
    """Kahoot 報表:每題一個工作表,另有 RawReportData 之類的總表。
    先找總表;找不到就掃每個 sheet 的 'Answer Details'。"""
    xl = pd.ExcelFile(path)
    for sn in xl.sheet_names:
        if "raw" in sn.lower() or "final scores" in sn.lower():
            df = xl.parse(sn)
            qs = pick(df.columns, "question text", "question")
            st = pick(df.columns, "student name", "player", "nickname", "name")
            cr = pick(df.columns, "is correct", "correct / incorrect", "correct")
            if qs and st and cr:
                out = df[[st, qs, cr]].copy()
                out.columns = ["student","question","correct"]
                return out
    rows = []
    for sn in xl.sheet_names:
        if not re.match(r"^Q\s*\d+", sn, re.I): continue
        raw = xl.parse(sn, header=None)
        hdr = None
        for i in range(len(raw)):
            line = " ".join(str(x) for x in raw.iloc[i].tolist()).lower()
            if "player" in line and ("correct" in line or "answer" in line):
                hdr = i; break
        if hdr is None: continue
        df = xl.parse(sn, header=hdr)
        st = pick(df.columns, "player", "nickname")
        cr = pick(df.columns, "correct")
        qtxt = str(raw.iloc[0].dropna().tolist()[-1]) if len(raw) else sn
        if st and cr:
            t = df[[st, cr]].copy(); t.columns = ["student","correct"]
            t["question"] = qtxt; rows.append(t)
    if not rows:
        raise ValueError(f"Kahoot 檔認不出來:{os.path.basename(path)} — 請用 inspect 看欄位")
    return pd.concat(rows, ignore_index=True)[["student","question","correct"]]

def adapt_generic_csv(path):
    df = pd.read_csv(path, encoding="utf-8-sig")
    st = pick(df.columns, "student name", "student", "player", "nickname", "name", "email")
    qs = pick(df.columns, "question text", "question", "prompt", "item")
    cr = pick(df.columns, "correct", "score", "points", "result")
    missing = [n for n,v in [("學生",st),("題目",qs),("對錯",cr)] if v is None]
    if missing:
        raise ValueError(f"{os.path.basename(path)} 找不到欄位: {', '.join(missing)} — 請用 inspect 看欄位後手動補 adapter")
    out = df[[st, qs, cr]].copy(); out.columns = ["student","question","correct"]
    return out

ADAPTERS = {"kahoot": adapt_kahoot, "wayground": adapt_generic_csv,
            "gimkit": adapt_generic_csv, "wordwall": adapt_generic_csv}

# ---------------------------------------------------------------- core
def collect(exports_dir):
    frames = []
    for plat, fn in ADAPTERS.items():
        d = os.path.join(exports_dir, plat)
        if not os.path.isdir(d): continue
        for p in glob.glob(os.path.join(d, "*")):
            if os.path.basename(p).startswith("~$"): continue
            if not p.lower().endswith((".csv",".xlsx",".xls")): continue
            try:
                df = fn(p)
                df["platform"] = plat
                df["source"] = os.path.basename(p)
                frames.append(df)
                print(f"  ✓ {plat:10s} {os.path.basename(p):40s} {len(df):5d} 列")
            except Exception as e:
                print(f"  ✗ {plat:10s} {os.path.basename(p):40s} {e}")
    if not frames:
        sys.exit("exports/ 底下沒有讀到任何檔案。")
    return pd.concat(frames, ignore_index=True)

def run(args):
    gl = load_glossary(args.glossary)
    qb = load_qbank(args.qbank)
    print("讀取匯出檔:")
    df = collect(args.exports)

    df["correct_b"] = df["correct"].map(truthy_correct)
    df["qkey"] = df["question"].map(norm)
    m = df.merge(qb[["qkey","term_id"]], on="qkey", how="left")

    miss = m[m["term_id"].isna()]
    if len(miss):
        print(f"\n⚠ 有 {len(miss)} 列對不到 term_id({miss['qkey'].nunique()} 種題目)。最常見的:")
        for q, n in miss["question"].value_counts().head(8).items():
            print(f"   [{n:4d}] {str(q)[:60]}")
        print("   → 通常是在平台後台改過題目文字。請改來源 CSV 後重新匯入,或把新文字補進題庫主檔。")

    ok = m.dropna(subset=["term_id","correct_b"])
    if ok.empty: sys.exit("\n沒有可用資料(term_id 或對錯全部是空的)。")

    # 1) 術語層級
    t = (ok.groupby("term_id")
           .agg(作答次數=("correct_b","size"), 答對次數=("correct_b","sum"))
           .reset_index())
    t["正確率"] = (t["答對次數"]/t["作答次數"]).round(3)
    t = t.merge(gl[["term_id","week","zh","vi","en","note"]], on="term_id", how="left")
    t = t[["term_id","week","zh","vi","en","作答次數","答對次數","正確率","note"]] \
          .sort_values("正確率")

    # 2) 學生 × 術語
    sm = (ok.pivot_table(index="student", columns="term_id",
                         values="correct_b", aggfunc="mean").round(2))

    # 3) 需要補強的術語(正確率 < 0.6 且至少 5 次作答)
    weak = t[(t["正確率"]<0.6) & (t["作答次數"]>=5)]

    os.makedirs(args.out, exist_ok=True)
    p1 = os.path.join(args.out,"術語正確率.csv")
    p2 = os.path.join(args.out,"學生_術語矩陣.csv")
    p3 = os.path.join(args.out,"待補強術語.csv")
    for p, d in [(p1,t),(p2,sm),(p3,weak)]:
        d.to_csv(p, encoding="utf-8-sig", index=(d is sm))

    print(f"\n完成。{ok['term_id'].nunique()} 個術語、{ok['student'].nunique()} 位學生、{len(ok)} 筆作答。")
    if len(weak):
        print(f"\n正確率低於 60% 的術語({len(weak)} 個)——下週優先複習:")
        for _, r in weak.head(12).iterrows():
            print(f"  {r['term_id']}  {str(r['zh']):8s} {r['正確率']:.0%}  ({int(r['作答次數'])} 次)  {r['note']}")
    print(f"\n輸出:\n  {p1}\n  {p2}\n  {p3}")

def inspect(args):
    p = args.file
    print(f"檔案: {p}\n")
    if p.lower().endswith((".xlsx",".xls")):
        xl = pd.ExcelFile(p)
        print("工作表:", xl.sheet_names, "\n")
        for sn in xl.sheet_names[:6]:
            df = xl.parse(sn, nrows=6)
            print(f"--- [{sn}] shape={df.shape}")
            print("    欄位:", list(df.columns)[:14])
            print(df.head(3).to_string(max_colwidth=28), "\n")
    else:
        df = pd.read_csv(p, encoding="utf-8-sig", nrows=8)
        print("欄位:", list(df.columns))
        print(df.head(5).to_string(max_colwidth=28))
    print("\n把上面的欄位名貼給我,我就能把 adapter 寫死,不用再靠猜。")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="術語層級的跨平台學習成效追蹤")
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="跑分析")
    r.add_argument("--exports", default="./exports")
    r.add_argument("--out", default="./報表")
    r.add_argument("--glossary", default=GLOSSARY)
    r.add_argument("--qbank", nargs="*", default=[QBANK])
    r.set_defaults(func=run)
    i = sub.add_parser("inspect", help="看某個匯出檔的欄位")
    i.add_argument("file"); i.set_defaults(func=inspect)
    a = ap.parse_args(); a.func(a)
