/* Opt-in links from the eight authored lessons; existing simulations stay intact. */
(() => {
  const week = typeof WEEK !== 'undefined' ? Number(WEEK.week) : 0;
  if (week < 1 || week > 8 || document.getElementById('handwrite-link')) return;
  const host = document.querySelector('#keypoints');
  if (!host) return;
  const section = document.createElement('section');
  section.id = 'handwrite-link';
  const title = document.createElement('h2');
  title.textContent = '✍ 本週手寫動畫';
  const description = document.createElement('p');
  description.textContent = '中文女聲＋越南語關鍵詞。先看逐步圖解，想好後再繼續核對。';
  const link = document.createElement('a');
  link.href = `../../handwrite/w${String(week).padStart(2, '0')}.html`;
  link.textContent = '選擇本週章節／Bài giảng viết tay →';
  section.append(title, description, link);
  host.before(section);
  const nav = document.querySelector('.nav .wrap');
  if (nav) {
    const shortcut = document.createElement('a');
    shortcut.href = '#handwrite-link';
    shortcut.textContent = '✍ 手寫動畫';
    nav.prepend(shortcut);
  }
})();
