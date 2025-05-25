// Flashcards data is now populated from Flask in the template

let currentIndex = 0;
const cardElement = document.getElementById('flashcard');

function displayCard(index, direction = 'right') {
  // If there are no flashcards, show message
  if (flashcards.length === 0) {
    document.getElementById('word').textContent = "No flashcards yet";
    document.getElementById('word-back').textContent = "No flashcards yet";
    document.getElementById('type').textContent = "";
    document.getElementById('meaning').textContent = "Create your first flashcard in Memory Forge";
    document.getElementById('level').textContent = "";
    return;
  }
  
  // Add fade-out class
  cardElement.classList.add(direction === 'right' ? 'fade-out-left' : 'fade-out-right');

  // Wait for animation to complete, then update content
  setTimeout(() => {
    const card = flashcards[index];
    document.getElementById('word').textContent = card.word;
    document.getElementById('word-back').textContent = card.word;
    document.getElementById('type').textContent = card.type;
    document.getElementById('meaning').textContent = card.meaning;
    document.getElementById('level').textContent = card.level;

    // Reset flip
    cardElement.classList.remove('flipped');

    // Remove fade-out, trigger fade-in
    cardElement.classList.remove('fade-out-left', 'fade-out-right');
    cardElement.classList.add('fade-in');

    // Remove fade-in after animation completes
    setTimeout(() => {
      cardElement.classList.remove('fade-in');
    }, 400);
  }, 400);
}

// Only attach event listeners if there are flashcards
if (flashcards.length > 0) {
  document.getElementById('nextBtn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % flashcards.length;
    displayCard(currentIndex, 'right');
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
    displayCard(currentIndex, 'left');
  });

  // Attach click event to flashcard
  cardElement.addEventListener('click', () => {
    cardElement.classList.toggle('flipped');
  });
}

// Load first card
displayCard(currentIndex);