const categorySelect = document.getElementById('category');
const customInput = document.getElementById('customCategory');
const customCategoryGroup = document.getElementById('customCategoryGroup');
const submitBtn = document.getElementById('submitBtn');
const flashcardForm = document.getElementById('flashcardForm');

// Toggle custom category input visibility
categorySelect.addEventListener('change', () => {
  if (categorySelect.value === 'add_new') {
    customCategoryGroup.style.display = 'block';
    customInput.required = true;
  } else {
    customCategoryGroup.style.display = 'none';
    customInput.required = false;
  }
});

// Submit button event listener
submitBtn.addEventListener('click', async () => {
  // Validate form
  if (!validateForm()) {
    return;
  }

  // Get form data
  const flashcardData = {
    VocabWord: document.getElementById('word').value.trim(),
    WordType: document.getElementById('wordType').value,
    Meaning: document.getElementById('meaning').value.trim(),
    Example: document.getElementById('example').value.trim(),
    WordLevel: document.getElementById('wordLevel').value,
    Category: categorySelect.value,
    CustomCategory: customInput.value.trim()
  };

  try {
    const response = await fetch('/submit-flashcard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flashcardData)
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      // Reset form
      flashcardForm.reset();
      // Show success popup
      showPopup();
    } else {
      alert(result.message || 'Error submitting flashcard');
    }
  } catch (error) {
    console.error('Error submitting flashcard:', error);
    alert('Something went wrong!');
  }
});

function validateForm() {
  const word = document.getElementById('word').value.trim();
  const wordType = document.getElementById('wordType').value;
  const meaning = document.getElementById('meaning').value.trim();
  const example = document.getElementById('example').value.trim();
  const wordLevel = document.getElementById('wordLevel').value;
  const category = categorySelect.value;
  
  if (!word) {
    alert('Please enter a word');
    return false;
  }
  
  if (word.length > 100) {
    alert('Word must be 100 characters or less');
    return false;
  }
  
  if (!wordType) {
    alert('Please select a word type');
    return false;
  }
  
  if (!meaning) {
    alert('Please enter a meaning');
    return false;
  }
  
  if (meaning.length > 4000) {
    alert('Meaning must be 4000 characters or less');
    return false;
  }
  
  if (example && example.length > 4000) {
    alert('Example must be 4000 characters or less');
    return false;
  }
  
  if (!wordLevel) {
    alert('Please select a word level');
    return false;
  }
  
  if (!category) {
    alert('Please select a category');
    return false;
  }
  
  if (category === 'add_new' && !customInput.value.trim()) {
    alert('Please enter a new category name');
    return false;
  }
  
  return true;
}

function showPopup() {
  document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
  document.getElementById('popup').style.display = 'none';
}

// Attach closePopup to popup close button
document.querySelector('#popup button').addEventListener('click', closePopup);