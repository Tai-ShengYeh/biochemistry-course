#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_banks.py — 從三語詞彙表產生各週的「越南語→中文」辨識題庫。

設計理由:
  每週小測的目的是「認得中文標籤」,不是申論生化。越南語的生化詞≈英文,
  學生概念已經有了,缺的是中文那一層。所以題型固定為 越→中 辨識。

誘答規則:
  1. 只從「同一週」的術語挑 —— 跨週誘答太好排除,題目會變送分。
  2. 優先挑中文字數與正解相近的 —— 避免「最長的那個就是答案」這種破綻。
  3. 不挑與正解中文完全重疊或互為子字串的。

用法:  python gen_banks.py            # 產生全部週次
       python gen_banks.py --weeks 2 3
"""
import csv, random, argparse, os, collections, sys
from balance_options import rebalance, report, write_kahoot, write_wayground

GLOSS = "../glossary_ids.csv"
OUTDIR = "../banks"
MAXQ = None        # 不設上限:每個術語都要有題。小測從中抽 5,其餘給 Gimkit 練習。
                   # 曾經設 15,結果每週第16個以後的術語(含「緩衝溶液」「糖尿病」)一題都沒有 —— 別再加回來。
EXAM_WEEKS = {8, 18}

TOPIC = {2:"水、pH 與緩衝溶液",3:"胺基酸與胜肽",4:"蛋白質三維結構",5:"蛋白質功能:肌紅素與血紅素",
 6:"酵素(一):催化原理",7:"酵素(二):動力學與抑制",9:"碳水化合物",10:"脂質與生物膜",
 11:"核苷酸與核酸",12:"生物能量學:ΔG 與 ATP",13:"糖解作用",14:"檸檬酸循環",
 15:"氧化磷酸化",16:"脂肪酸與胺基酸代謝",17:"代謝整合與激素調節"}

def load():
    g = collections.defaultdict(list)
    for r in csv.DictReader(open(GLOSS, encoding="utf-8-sig")):
        g[int(r["week"])].append(r)
    return g

# 真同義詞:指同一個東西,絕不可互當誘答(否則一題兩個正解)。
# 這幾對是掃描全詞彙表後人工判定的 —— 字面不重疊,程式規則擋不掉。
EXCLUSIVE_PAIRS = [
    {"檸檬酸循環", "克氏循環"},        # Citric acid cycle = Krebs cycle
    {"電子傳遞鏈", "呼吸鏈"},          # Electron transport chain = Respiratory chain
]

def blocked(a, b):
    for p in EXCLUSIVE_PAIRS:
        if a in p and b in p:
            return True
    return False

def has_conflict(opts):
    """整組選項裡不可以有任何一對同義詞 —— 包括兩個誘答彼此同義。
    否則學生一看『這兩個是同一個東西』就知道兩個都不是答案,白送一半選項。"""
    for p in EXCLUSIVE_PAIRS:
        if len(p & set(opts)) >= 2:
            return True
    return False

def pick_distractors(ans, pool, rng, n=3):
    """同週、中文字數相近、不重疊、非同義詞。"""
    cands = [p for p in pool
             if p["zh"] != ans["zh"]
             and p["zh"] not in ans["zh"] and ans["zh"] not in p["zh"]
             and not blocked(p["zh"], ans["zh"])]
    if len(cands) < n:
        return None
    L = len(ans["zh"])
    cands.sort(key=lambda p: (abs(len(p["zh"]) - L), rng.random()))
    near = cands[:max(n + 4, len(cands) // 2)]   # 先取字數相近的一半,再隨機
    for _ in range(60):
        rng.shuffle(near)
        pick = near[:n]
        if not has_conflict([ans["zh"]] + [p["zh"] for p in pick]):
            return pick
    # 退路:從全部候選裡硬挑一組無衝突的
    for _ in range(200):
        rng.shuffle(cands)
        pick = cands[:n]
        if not has_conflict([ans["zh"]] + [p["zh"] for p in pick]):
            return pick
    return None

def build_week(wk, terms, seed):
    rng = random.Random(1000 + wk + seed)
    rows = []
    pool = terms[:]
    chosen = terms if MAXQ is None else terms[:MAXQ]
    for t in chosen:
        ds = pick_distractors(t, pool, rng)
        if ds is None:
            print(f"  ⚠ W{wk:02d} {t['zh']}:同週可用誘答不足,略過"); continue
        opts = [t["zh"]] + [d["zh"] for d in ds]
        rows.append({"term_id": t["term_id"], "week": str(wk), "zh_term": t["zh"],
                     "vi_term": t["vi"], "en_term": t["en"],
                     "question": f"「{t['vi']}」的中文是什麼?",
                     "opt1": opts[0], "opt2": opts[1], "opt3": opts[2], "opt4": opts[3],
                     "correct": "1", "type": "越→中"})
    return rows

def validate(wk, rows):
    errs = []
    for r in rows:
        o = [r[f"opt{i}"] for i in range(1, 5)]
        if len(set(o)) != 4: errs.append(f"選項重複 {r['zh_term']}: {o}")
        if has_conflict(o): errs.append(f"同義詞同時出現 {r['zh_term']}: {o}")
        if o[int(r["correct"]) - 1] != r["zh_term"]: errs.append(f"正解跑掉 {r['zh_term']}")
        if len(r["question"]) > 95: errs.append(f"題幹超長 {r['zh_term']} ({len(r['question'])})")
        for x in o:
            if len(x) > 60: errs.append(f"選項超長 {x}")
    qs = [r["question"] for r in rows]
    if len(set(qs)) != len(qs): errs.append("同週有重複題幹")
    return errs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weeks", nargs="*", type=int)
    ap.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()
    g = load()
    weeks = a.weeks or sorted(w for w in g if w not in EXAM_WEEKS and w != 1)
    os.makedirs(OUTDIR, exist_ok=True)
    total, bad = 0, 0
    print(f"{'週':>3} {'主題':22} {'題數':>4}  正解分布      狀態")
    print("-" * 72)
    for wk in weeks:
        rows = build_week(wk, g[wk], a.seed)
        rows = rebalance(rows, seed=a.seed + wk)
        errs = validate(wk, rows)
        c = collections.Counter(r["correct"] for r in rows)
        dist = "/".join(str(c.get(str(k), 0)) for k in range(1, 5))
        span = max(c.values()) - min(c.get(str(k), 0) for k in range(1, 5))
        bank = os.path.join(OUTDIR, f"W{wk:02d}_題庫_主檔.csv")
        with open(bank, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
        kbad = write_kahoot(rows, os.path.join(OUTDIR, f"W{wk:02d}_Kahoot匯入.xlsx"))
        write_wayground(rows, os.path.join(OUTDIR, f"W{wk:02d}_Wayground_貼上用.csv"))
        st = "OK" if not errs and not kbad and span <= 1 else "✗ " + "; ".join(errs + [str(kbad)])[:40]
        if errs or kbad or span > 1: bad += 1
        print(f"{wk:>3} {TOPIC[wk][:20]:22} {len(rows):>4}  {dist:12}  {st}")
        total += len(rows)
    print("-" * 72)
    print(f"合計 {total} 題,{len(weeks)} 週。{'全部通過驗證' if bad == 0 else f'{bad} 週有問題'}")

if __name__ == "__main__":
    main()
