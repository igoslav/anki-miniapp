// --- Find Image ---
const LANG_TO_WIKI = {
  'arabic': 'ar', 'chinese': 'zh', 'czech': 'cs', 'danish': 'da',
  'dutch': 'nl', 'english': 'en', 'finnish': 'fi', 'french': 'fr',
  'german': 'de', 'greek': 'el', 'hebrew': 'he', 'hindi': 'hi',
  'hungarian': 'hu', 'indonesian': 'id', 'italian': 'it', 'japanese': 'ja',
  'korean': 'ko', 'norwegian': 'no', 'persian': 'fa', 'polish': 'pl',
  'portuguese': 'pt', 'romanian': 'ro', 'russian': 'ru', 'serbian': 'sr',
  'spanish': 'es', 'swedish': 'sv', 'thai': 'th', 'turkish': 'tr',
  'ukrainian': 'uk', 'vietnamese': 'vi'
};

function getSourceWikiLang() {
  if (!userData || !userData.activeLanguagePairId) return 'en';
  const pair = userData.languagePairs.find(lp => lp.id === userData.activeLanguagePairId);
  if (!pair) return 'en';
  return LANG_TO_WIKI[pair.source.toLowerCase()] || 'en';
}

async function wikiThumbnail(lang, word) {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
  if (res.ok) {
    const data = await res.json();
    if (data.thumbnail && data.thumbnail.source) return data.thumbnail.source;
  }
  return null;
}

async function fetchImageUrl(word) {
  const lang = getSourceWikiLang();

  // 1. Source-language Wikipedia (e.g. it.wikipedia.org for Italian)
  try {
    const url = await wikiThumbnail(lang, word);
    if (url) return url;
  } catch {}

  // 2. English Wikipedia fallback
  if (lang !== 'en') {
    try {
      const url = await wikiThumbnail('en', word);
      if (url) return url;
    } catch {}
  }

  // 3. Wiktionary fallback
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail && data.thumbnail.source) return data.thumbnail.source;
    }
  } catch {}

  return null;
}

async function findImage() {
  const word = document.getElementById('inputWord').value.trim();
  if (!word) {
    tg.showAlert('Enter a word first.');
    return;
  }

  const btn = document.getElementById('findImageBtn');
  const btnText = document.getElementById('findImageText');
  btn.disabled = true;
  btnText.textContent = 'Searching...';

  try {
    const url = await fetchImageUrl(word);
    if (url) {
      setCardImage(url);
      hapticNotify('success');
    } else {
      tg.showAlert('No image found for this word.');
      haptic('light');
    }
  } catch {
    tg.showAlert('Image search failed.');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Find Image';
  }
}

function setCardImage(url) {
  document.getElementById('inputImageUrl').value = url;
  const preview = document.getElementById('imagePreview');
  const img = document.getElementById('imagePreviewImg');
  img.src = url;
  preview.classList.remove('hidden');
}

function clearCardImage() {
  document.getElementById('inputImageUrl').value = '';
  const preview = document.getElementById('imagePreview');
  preview.classList.add('hidden');
  document.getElementById('imagePreviewImg').src = '';
}

// --- Add Card ---
async function addCard(e) {
  e.preventDefault();
  const word = document.getElementById('inputWord').value.trim();
  const translation = document.getElementById('inputTranslation').value.trim();
  const example = document.getElementById('inputExample').value.trim();
  const pronunciation = document.getElementById('inputPronunciation').value.trim();
  const imageUrl = document.getElementById('inputImageUrl').value;

  if (!word || !translation) return;

  if (!userData.activeLanguagePairId) {
    tg.showAlert('Please add a language pair first.');
    return;
  }

  const card = await apiPost('/card', { word, translation, example, pronunciation, imageUrl, languagePairId: userData.activeLanguagePairId });
  userData.cards.push(card);
  activeCards = getActiveCards();

  document.getElementById('addCardForm').reset();
  clearCardImage();
  hapticNotify('success');
  showScreen('homeScreen');
}
