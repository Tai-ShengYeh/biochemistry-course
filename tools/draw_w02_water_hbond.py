#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
draw_w02_water_hbond.py — 重繪 W02「水分子氫鍵 + 甲烷疏水」示意圖。

2026-10-16：原 AI 生成圖（exec-e2508b0f…）化學錯誤——多條氫鍵虛線畫成
H…H（δ+ 對 δ+）。本腳本改為程式繪製：每條氫鍵一律由
(供體分子的 H, 受體分子的 O) 座標對產生，結構上不可能畫錯。

標號語意沿用（題庫 W02-E01 與 w09 標圖牆解答依賴）：
  ① 左圖：水分子間的氫鍵（虛線）
  ② 右圖：甲烷（C–H 非極性、不形成氫鍵）

輸出：
  assets/redrawn/w02_water_hbond_clean.png    (1672x941)
  assets/redrawn/w02_water_hbond_labeled.png  (1672x941)
"""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch

BG = "#FAF3E0"
O_COL, O_EDGE = "#D7191C", "#8E0E10"
H_COL, H_EDGE = "#F2F0EB", "#9A968C"
C_COL, C_EDGE = "#2B2B2B", "#000000"
BOND = "#B9B4A8"
DASH = "#1A1A1A"
DMINUS, DPLUS = "#D7191C", "#1F4EC2"

R_O, R_H, R_C = 0.30, 0.185, 0.34

def sphere(ax, xy, r, face, edge, z=3):
    ax.add_patch(Circle(xy, r, facecolor=face, edgecolor=edge, lw=1.6, zorder=z))
    # 左上高光，模擬球感
    ax.add_patch(Circle((xy[0]-r*0.32, xy[1]+r*0.34), r*0.34,
                        facecolor="white", edgecolor="none", alpha=0.45, zorder=z+1))

def stick(ax, a, b):
    ax.plot([a[0], b[0]], [a[1], b[1]], color=BOND, lw=7,
            solid_capstyle="round", zorder=1)

def atom_label(ax, xy, text, size, z=6, col="black"):
    ax.text(xy[0], xy[1], text, ha="center", va="center",
            fontsize=size, fontweight="bold", color=col, zorder=z)

def delta(ax, xy, kind, size=15):
    ax.text(xy[0], xy[1], "δ−" if kind == "-" else "δ+",
            ha="center", va="center", fontsize=size, fontstyle="italic",
            fontweight="bold",
            color=DMINUS if kind == "-" else DPLUS, zorder=7)

def water(ax, O, H_list, dminus=None, dplus_idx=()):
    """畫一個水分子。O=(x,y)，H_list=[(x,y),...]。回傳原子座標供氫鍵使用。"""
    for Hxy in H_list:
        stick(ax, O, Hxy)
    sphere(ax, O, R_O, O_COL, O_EDGE)
    atom_label(ax, O, "O", 17, col="white")
    for Hxy in H_list:
        sphere(ax, Hxy, R_H, H_COL, H_EDGE)
        atom_label(ax, Hxy, "H", 12)
    if dminus is not None:
        delta(ax, dminus, "-")
    for i in dplus_idx:
        Hxy = H_list[i]
        v = (Hxy[0]-O[0], Hxy[1]-O[1])
        n = math.hypot(*v)
        # 放在 O–H 鍵的垂直方向，避免壓到同方向延伸的氫鍵虛線
        px, py = -v[1]/n, v[0]/n
        delta(ax, (Hxy[0]+px*0.36, Hxy[1]+py*0.36), "+", 13)
    return {"O": O, "H": H_list}

def hbond(ax, donor_H, acceptor_O):
    """氫鍵：只接受 (H 座標, O 座標)。從 H 球邊緣畫到 O 球邊緣。"""
    dx, dy = acceptor_O[0]-donor_H[0], acceptor_O[1]-donor_H[1]
    n = math.hypot(dx, dy)
    ux, uy = dx/n, dy/n
    a = (donor_H[0]+ux*(R_H+0.05), donor_H[1]+uy*(R_H+0.05))
    b = (acceptor_O[0]-ux*(R_O+0.05), acceptor_O[1]-uy*(R_O+0.05))
    ax.plot([a[0], b[0]], [a[1], b[1]], color=DASH, lw=2.4,
            linestyle=(0, (4, 3)), zorder=2)
    return ((a[0]+b[0])/2, (a[1]+b[1])/2)   # 中點，給標號用

def badge(ax, xy, num):
    ax.add_patch(Circle(xy, 0.17, facecolor="#C21807", edgecolor="white",
                        lw=2, zorder=9))
    ax.text(xy[0], xy[1], str(num), ha="center", va="center",
            fontsize=13, fontweight="bold", color="white", zorder=10)

def rot(v, deg):
    r = math.radians(deg)
    return (v[0]*math.cos(r)-v[1]*math.sin(r), v[0]*math.sin(r)+v[1]*math.cos(r))

def draw(labeled, out):
    fig, (axL, axR) = plt.subplots(
        1, 2, figsize=(16.72, 9.41), dpi=100,
        gridspec_kw={"width_ratios": [1, 1]})
    fig.patch.set_facecolor(BG)
    for ax in (axL, axR):
        ax.set_facecolor(BG)
        ax.set_aspect("equal")
        ax.axis("off")

    HB = []   # (donor_H, acceptor_O) — 唯一允許的氫鍵形式

    # ---------- 左圖：氫鍵網絡（中央水 捐2 收2） ----------
    OH = 0.62  # O–H 鍵長
    c = water(axL, (0, 0.30),
              [(-0.52, -0.18), (0.52, -0.18)],
              dminus=(0, 0.75), dplus_idx=(0, 1))

    # 兩個供體（左上、右上）：各有一個 H 指向中央 O
    for sx in (-1, 1):
        Od = (sx*1.55, 1.75)
        Hd = (Od[0]-sx*0.50, Od[1]-0.42)        # 指向中央 O 的 H
        Ho = (Od[0]+sx*0.28, Od[1]+0.58)        # 另一個 H 朝外
        water(axL, Od, [Hd, Ho],
              dminus=(Od[0]+sx*0.42, Od[1]+0.12), dplus_idx=(0,))
        HB.append((Hd, c["O"]))

    # 兩個受體（左下、右下）：O 朝向中央的 H
    for sx, hi in ((-1, 0), (1, 1)):
        Oa = (sx*1.30, -1.35)
        H1 = (Oa[0]-sx*0.62, Oa[1]-0.12)
        H2 = (Oa[0]-sx*0.10, Oa[1]-0.62)
        water(axL, Oa, [H1, H2],
              dminus=(Oa[0]+sx*0.38, Oa[1]+0.30))
        HB.append((c["H"][hi], Oa))

    axL.set_xlim(-3.0, 3.0)
    axL.set_ylim(-2.6, 2.9)

    # ---------- 右圖：水籠包住甲烷（疏水），虛線不碰 CH4 ----------
    Cc = (0, 0)
    ch_H = [(0, 0.72), (-0.66, -0.34), (0.66, -0.34), (0.10, -0.78)]
    for Hxy in ch_H:
        stick(axR, Cc, Hxy)
    sphere(axR, Cc, R_C, C_COL, C_EDGE, z=4)
    atom_label(axR, Cc, "C", 16, col="white")
    for Hxy in ch_H:
        sphere(axR, Hxy, R_H, H_COL, H_EDGE, z=4)
        atom_label(axR, Hxy, "H", 11)

    N, RAD = 6, 2.25
    ring = []
    for i in range(N):
        th = 90 - i*360/N          # 順時針
        Opos = (RAD*math.cos(math.radians(th)), RAD*math.sin(math.radians(th)))
        ring.append((th, Opos))
    for i, (th, Opos) in enumerate(ring):
        nxt_O = ring[(i+1) % N][1]
        # 捐出的 H：從 O 指向下一個水的 O
        v = (nxt_O[0]-Opos[0], nxt_O[1]-Opos[1])
        n = math.hypot(*v)
        Hd = (Opos[0]+v[0]/n*OH, Opos[1]+v[1]/n*OH)
        # 另一個 H 朝環外
        outw = (Opos[0]/RAD, Opos[1]/RAD)
        vo = rot(outw, 35)
        Ho = (Opos[0]+vo[0]*OH, Opos[1]+vo[1]*OH)
        water(axR, Opos, [Hd, Ho],
              dminus=(Opos[0]+outw[0]*0.55-vo[0]*0.18,
                      Opos[1]+outw[1]*0.55-vo[1]*0.18),
              dplus_idx=(0,))
        HB.append((Hd, nxt_O))

    axR.set_xlim(-3.4, 3.4)
    axR.set_ylim(-3.3, 3.4)

    # ---------- 氫鍵總繪製 + 結構性檢查 ----------
    mids = []
    for donor_H, acceptor_O in HB:
        assert isinstance(donor_H, tuple) and isinstance(acceptor_O, tuple)
        mids.append(hbond(axL if len(mids) < 4 else axR, donor_H, acceptor_O))
    assert len(HB) == 4 + N, f"氫鍵數不對：{len(HB)}"

    if labeled:
        # ① 放在左圖「左上供體 → 中央O」那條虛線旁
        m = mids[0]
        badge(axL, (m[0]-0.38, m[1]+0.10), 1)
        # ② 放在甲烷旁
        badge(axR, (Cc[0]-0.62, Cc[1]+0.52), 2)

    plt.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01, wspace=0.04)
    fig.savefig(out, facecolor=BG)
    plt.close(fig)
    print("wrote", out)

if __name__ == "__main__":
    import os
    base = os.path.join(os.path.dirname(__file__), "..", "assets", "redrawn")
    draw(False, os.path.join(base, "w02_water_hbond_clean.png"))
    draw(True,  os.path.join(base, "w02_water_hbond_labeled.png"))
