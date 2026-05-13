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

  if (editingCardId) {
    const updated = await apiPut(`/card/${editingCardId}`, { word, translation, example, pronunciation, imageUrl });
    const idx = userData.cards.findIndex(c => c.id === editingCardId);
    if (idx !== -1) userData.cards[idx] = updated;
    activeCards = getActiveCards();
    resetCardForm();
    hapticNotify('success');
    showScreen('cardListScreen');
    return;
  }

  const card = await apiPost('/card', { word, translation, example, pronunciation, imageUrl });
  userData.cards.push(card);
  activeCards = getActiveCards();

  resetCardForm();
  hapticNotify('success');
  showScreen('homeScreen');
}

function resetCardForm() {
  document.getElementById('addCardForm').reset();
  clearCardImage();
  editingCardId = null;
  document.getElementById('addCardTitle').textContent = 'Add New Card';
  document.getElementById('saveCardBtn').textContent = 'Save Card';
}

function openEditCard(cardId) {
  const card = userData.cards.find(c => c.id === cardId);
  if (!card) return;
  editingCardId = cardId;
  document.getElementById('inputWord').value = card.front.word || '';
  document.getElementById('inputTranslation').value = card.back.translation || '';
  document.getElementById('inputExample').value = card.back.example || '';
  document.getElementById('inputPronunciation').value = card.back.pronunciation || '';
  if (card.front.imageUrl) {
    setCardImage(card.front.imageUrl);
  } else {
    clearCardImage();
  }
  document.getElementById('addCardTitle').textContent = 'Edit Card';
  document.getElementById('saveCardBtn').textContent = 'Save Changes';
  showScreen('addCardScreen');
}
