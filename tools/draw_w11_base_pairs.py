#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
draw_w11_base_pairs.py — 重繪 W11 DNA 圖的右半（A–T / G–C 鹼基配對）。

2026-10-16：原 AI 圖的 A–T 配對化學錯誤——上方氫鍵畫成 N…N（未經 H），
且羰基 O 未參與。左半的雙螺旋插畫（反平行 5'/3'、大小溝）正確，保留原圖；
右半改為程式繪製，每條氫鍵由 (供體H, 受體O/N) 座標對產生，結構上不可能畫錯。

正確配對：
  A–T 2 條：A 的 N6–H … O4=C(T)；T 的 N3–H … N1(A)
  G–C 3 條：C 的 N4–H … O6=C(G)；G 的 N1–H … N3(C)；G 的 N2–H … O2=C(C)

標號語意沿用（w18 標圖牆與題庫 W11-E01 依賴）：
  ① 大溝  ② 小溝（左半螺旋）  ③ A–T（2 氫鍵）  ④ G–C（3 氫鍵）

輸出：assets/redrawn/w11_dna_helix_clean.png / _labeled.png (1672x941)
"""
import math, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False
from matplotlib.patches import Polygon, Circle
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, "..", "assets", "redrawn")
SRC  = os.path.join(BASE, "_w11_helix_left_backup.png")   # 原圖左半備份（首次執行時建立）
ORIG = os.path.join(BASE, "w11_dna_helix_clean.png")

BG = "#FBF4E2"
A_FILL, T_FILL = "#B9CCEA", "#F3E3A2"
G_FILL, C_FILL = "#CBE0B4", "#F2C3BB"
EDGE = "#2B2B2B"
DASH = "#1A1A1A"

def hexagon(center, r, rot=0):
    return [(center[0] + r*math.cos(math.radians(a + rot)),
             center[1] + r*math.sin(math.radians(a + rot))) for a in range(0, 360, 60)]

def atom(ax, xy, s, color="#1A1A1A", size=15):
    ax.text(xy[0], xy[1], s, ha="center", va="center", fontsize=size,
            fontweight="bold", color=color, zorder=6,
            bbox=dict(boxstyle="circle,pad=0.08", fc=BG, ec="none"))

def bond(ax, a, b, double=False):
    if double:
        dx, dy = b[0]-a[0], b[1]-a[1]
        n = math.hypot(dx, dy); px, py = -dy/n*0.055, dx/n*0.055
        ax.plot([a[0]+px, b[0]+px], [a[1]+py, b[1]+py], color=EDGE, lw=2, zorder=3)
        ax.plot([a[0]-px, b[0]-px], [a[1]-py, b[1]-py], color=EDGE, lw=2, zorder=3)
    else:
        ax.plot([a[0], b[0]], [a[1], b[1]], color=EDGE, lw=2, zorder=3)

def out(v_from, v_to, k):
    """從 v_from 往 v_to 方向延伸 k。"""
    dx, dy = v_to[0]-v_from[0], v_to[1]-v_from[1]
    n = math.hypot(dx, dy)
    return (v_from[0]+dx/n*k, v_from[1]+dy/n*k)

HBONDS = []  # (H_xy, acceptor_xy, acceptor_symbol) — 唯一允許的氫鍵形式

def hbond(ax, H_xy, acc_xy, acc_sym):
    assert acc_sym in ("O", "N"), f"受體必須是 O 或 N，不是 {acc_sym}"
    dx, dy = acc_xy[0]-H_xy[0], acc_xy[1]-H_xy[1]
    n = math.hypot(dx, dy); ux, uy = dx/n, dy/n
    a = (H_xy[0]+ux*0.22, H_xy[1]+uy*0.22)
    b = (acc_xy[0]-ux*0.24, acc_xy[1]-uy*0.24)
    ax.plot([a[0], b[0]], [a[1], b[1]], color=DASH, lw=2.2,
            linestyle=(0, (4, 3)), zorder=2)
    HBONDS.append((H_xy, acc_xy, acc_sym))

def purine(ax, c, fill):
    """腺嘌呤/鳥嘌呤骨架。回傳關鍵頂點：N1(0°) C6(60°) C5(120°) C4(180°) N3(240°) C2(300°) 與五環。"""
    v = hexagon(c, 0.95)                      # v[0]=0°,v[1]=60°,…
    N1, C6, C5, C4, N3, C2 = v[0], v[1], v[2], v[3], v[4], v[5]
    # 五員環（咪唑）掛在 C4–C5 外側（左側）
    mid = ((C4[0]+C5[0])/2, (C4[1]+C5[1])/2)
    o = out(c, mid, 1.72)                     # 五環外頂點 C8
    N7 = out(c, ((C5[0]+o[0])/2, (C5[1]+o[1])/2), 1.52)
    N9 = out(c, ((C4[0]+o[0])/2, (C4[1]+o[1])/2), 1.52)
    ax.add_patch(Polygon(v, closed=True, facecolor=fill, edgecolor=EDGE, lw=2, zorder=1))
    ax.add_patch(Polygon([C5, N7, o, N9, C4], closed=True, facecolor=fill,
                         edgecolor=EDGE, lw=2, zorder=1))
    atom(ax, N7, "N"); atom(ax, N9, "N"); atom(ax, N3, "N")
    return {"N1": N1, "C6": C6, "C2": C2, "c": c}

def pyrimidine(ax, c, fill):
    """胸腺嘧啶/胞嘧啶骨架。N3(180°) C4(120°) C5(60°) C6(0°) N1(300°) C2(240°)。"""
    v = hexagon(c, 0.95)
    C6, C5, C4, N3, C2, N1 = v[0], v[1], v[2], v[3], v[4], v[5]
    ax.add_patch(Polygon(v, closed=True, facecolor=fill, edgecolor=EDGE, lw=2, zorder=1))
    atom(ax, N1, "N")
    return {"N3": N3, "C4": C4, "C2": C2, "C5": C5, "c": c}

def draw_right(ax):
    ax.set_xlim(0, 10); ax.set_ylim(0, 11)
    ax.set_aspect("equal"); ax.axis("off"); ax.set_facecolor(BG)

    # ================= A–T（上，2 條氫鍵） =================
    A = purine(ax, (2.9, 8.1), A_FILL)
    T = pyrimidine(ax, (7.1, 8.1), T_FILL)
    ax.text(0.45, 8.1, "A–T", fontsize=19, fontweight="bold", va="center")
    ax.text(0.45, 7.55, "2 個氫鍵", fontsize=11, va="center", color="#555")

    # A：C6 上的胺基 N6H2（供體）
    N6 = out(A["C6"], out(A["c"], A["C6"], 2.0), 0.62)
    bond(ax, A["C6"], N6); atom(ax, N6, "N")
    H_up  = (N6[0]-0.42, N6[1]+0.42)
    H_rt  = (N6[0]+0.58, N6[1]+0.05)          # 指向 T 的 O4
    bond(ax, N6, H_up); atom(ax, H_up, "H", size=12)
    bond(ax, N6, H_rt); atom(ax, H_rt, "H", size=12)
    atom(ax, A["N1"], "N")                     # N1 受體

    # T：C4 上的羰基 O4（受體，朝左上）、N3–H（供體，朝左）、C5 上的 CH3
    O4 = out(T["C4"], out(T["c"], T["C4"], 2.0), 0.60)
    bond(ax, T["C4"], O4, double=True); atom(ax, O4, "O", color="#C00000")
    atom(ax, T["N3"], "N")
    H3 = (T["N3"][0]-0.60, T["N3"][1])
    bond(ax, T["N3"], H3); atom(ax, H3, "H", size=12)
    O2t = out(T["C2"], out(T["c"], T["C2"], 2.0), 0.60)
    bond(ax, T["C2"], O2t, double=True); atom(ax, O2t, "O", color="#C00000")
    CH3 = out(T["C5"], out(T["c"], T["C5"], 2.0), 0.62)
    bond(ax, T["C5"], CH3)
    ax.text(CH3[0]+0.12, CH3[1], "CH$_3$", fontsize=13, fontweight="bold",
            va="center", ha="left", zorder=6,
            bbox=dict(boxstyle="round,pad=0.1", fc=BG, ec="none"))

    hbond(ax, H_rt, O4, "O")                   # N6–H … O4
    hbond(ax, H3, A["N1"], "N")                # N3–H … N1

    # ================= G–C（下，3 條氫鍵） =================
    G = purine(ax, (2.9, 2.9), G_FILL)
    C = pyrimidine(ax, (7.1, 2.9), C_FILL)
    ax.text(0.45, 2.9, "G–C", fontsize=19, fontweight="bold", va="center")
    ax.text(0.45, 2.35, "3 個氫鍵", fontsize=11, va="center", color="#555")

    # G：C6 上羰基 O6（受體）、N1–H（供體）、C2 上胺基 N2H2（供體）
    O6 = out(G["C6"], out(G["c"], G["C6"], 2.0), 0.60)
    bond(ax, G["C6"], O6, double=True); atom(ax, O6, "O", color="#C00000")
    atom(ax, G["N1"], "N")
    H1 = (G["N1"][0]+0.60, G["N1"][1])
    bond(ax, G["N1"], H1); atom(ax, H1, "H", size=12)
    N2 = out(G["C2"], out(G["c"], G["C2"], 2.0), 0.62)
    bond(ax, G["C2"], N2); atom(ax, N2, "N")
    H2a = (N2[0]-0.42, N2[1]-0.42)
    H2b = (N2[0]+0.58, N2[1]+0.02)             # 指向 C 的 O2
    bond(ax, N2, H2a); atom(ax, H2a, "H", size=12)
    bond(ax, N2, H2b); atom(ax, H2b, "H", size=12)

    # C：C4 上胺基 N4H2（供體）、N3（受體）、C2 上羰基 O2（受體）
    N4 = out(C["C4"], out(C["c"], C["C4"], 2.0), 0.62)
    bond(ax, C["C4"], N4); atom(ax, N4, "N")
    H4a = (N4[0]+0.42, N4[1]+0.42)
    H4b = (N4[0]-0.60, N4[1]-0.02)             # 指向 G 的 O6
    bond(ax, N4, H4a); atom(ax, H4a, "H", size=12)
    bond(ax, N4, H4b); atom(ax, H4b, "H", size=12)
    atom(ax, C["N3"], "N")
    O2c = out(C["C2"], out(C["c"], C["C2"], 2.0), 0.60)
    bond(ax, C["C2"], O2c, double=True); atom(ax, O2c, "O", color="#C00000")

    hbond(ax, H4b, O6, "O")                    # N4–H … O6
    hbond(ax, H1, C["N3"], "N")                # N1–H … N3
    hbond(ax, H2b, O2c, "O")                   # N2–H … O2

def badge(fig, fx, fy, num):
    fig.add_artist(Circle((fx, fy), 0.013, transform=fig.transFigure,
                          facecolor="#C21807", edgecolor="white", lw=2, zorder=20))
    fig.text(fx, fy, str(num), ha="center", va="center", fontsize=12,
             fontweight="bold", color="white", zorder=21)

def main():
    # 首次執行：把原圖左半（螺旋插畫）裁下備份；之後重跑直接用備份，避免套娃
    if not os.path.exists(SRC):
        im = Image.open(ORIG)
        w, h = im.size
        im.crop((0, 0, int(w*0.46), h)).save(SRC)
        print("helix left-half backup ->", SRC)
    helix = Image.open(SRC)

    for labeled, name in [(False, "w11_dna_helix_clean.png"),
                          (True,  "w11_dna_helix_labeled.png")]:
        HBONDS.clear()
        fig = plt.figure(figsize=(16.72, 9.41), dpi=100)
        fig.patch.set_facecolor(BG)
        axL = fig.add_axes([0.0, 0.0, 0.46, 1.0]); axL.axis("off")
        axL.imshow(helix); axL.set_facecolor(BG)
        axR = fig.add_axes([0.46, 0.0, 0.54, 1.0])
        draw_right(axR)

        # 結構性檢查：A–T 2 條 + G–C 3 條，受體只能是 O 或 N
        assert len(HBONDS) == 5, f"氫鍵數不對：{len(HBONDS)}"
        assert [h[2] for h in HBONDS] == ["O", "N", "O", "N", "O"]

        if labeled:
            badge(fig, 0.215, 0.70, 1)   # 大溝（螺旋上段）
            badge(fig, 0.215, 0.40, 2)   # 小溝（螺旋下段）
            badge(fig, 0.555, 0.86, 3)   # A–T
            badge(fig, 0.555, 0.40, 4)   # G–C
        p = os.path.join(BASE, name)
        fig.savefig(p, facecolor=BG)
        plt.close(fig)
        print("wrote", p)

if __name__ == "__main__":
    main()
