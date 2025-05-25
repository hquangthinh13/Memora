// Complete manage.js file
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM content loaded");
  
  // Initialize all event listeners
  initializeEditButtons();
  initializeDeleteFlashcards();
  initializeToggleButtons();
  initializeCategoryDeletion();
  initializeScrollEffect();
  initializeFlashMessages();
});

// Function to handle scrolling effect
function initializeScrollEffect() {
  window.addEventListener('scroll', function() {
    const heading = document.querySelector('.manage-container h1');
    if (!heading) return;
    
    const triggerPoint = 10;
    if (window.scrollY > triggerPoint) {
      heading.classList.add('hidden');
    } else {
      heading.classList.remove('hidden');
    }
  });
}

// Function to initialize edit buttons
function initializeEditButtons() {
  const editBtns = document.querySelectorAll('.edit-btn');
  const editModal = document.getElementById('editModal');
  const closeBtn = document.querySelector('.close');
  const updateBtn = document.getElementById('updateBtn');
  
  if (!editModal || !updateBtn) {
    console.log("Edit modal elements not found");
    return;
  }
  
  // Open edit modal
  editBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const cardId = this.getAttribute('data-id');
      const word = this.getAttribute('data-word');
      const type = this.getAttribute('data-type');
      const meaning = this.getAttribute('data-meaning');
      const example = this.getAttribute('data-example') || '';
      const level = this.getAttribute('data-level');
      const category = this.getAttribute('data-category');
      
      // Check if all form elements exist before setting values
      const editCardIdElement = document.getElementById('editCardId');
      const editWordElement = document.getElementById('editWord');
      const editWordTypeElement = document.getElementById('editWordType');
      const editMeaningElement = document.getElementById('editMeaning');
      const editExampleElement = document.getElementById('editExample');
      const editWordLevelElement = document.getElementById('editWordLevel');
      const editCategoryElement = document.getElementById('editCategory');
      
      if (editCardIdElement) editCardIdElement.value = cardId;
      if (editWordElement) editWordElement.value = word;
      if (editWordTypeElement) editWordTypeElement.value = type;
      if (editMeaningElement) editMeaningElement.value = meaning;
      if (editExampleElement) editExampleElement.value = example;
      if (editWordLevelElement) editWordLevelElement.value = level;
      if (editCategoryElement) editCategoryElement.value = category;
      
      // Show modal
      editModal.style.display = 'flex';
    });
  });
  
  // Close edit modal
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      editModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  });
  
  // Update flashcard
  if (updateBtn) {
    updateBtn.addEventListener('click', async function() {
      // Validate form first
      if (!validateEditForm()) {
        return;
      }
      
      const cardId = document.getElementById('editCardId').value;
      
      const updatedData = {
        vocabWord: document.getElementById('editWord').value.trim(),
        wordType: document.getElementById('editWordType').value,
        meaning: document.getElementById('editMeaning').value.trim(),
        example: document.getElementById('editExample').value.trim(),
        wordLevel: document.getElementById('editWordLevel').value,
        categoryId: document.getElementById('editCategory').value
      };
      
      try {
        const response = await fetch(`/flashcard/${cardId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
          // Close modal
          editModal.style.display = 'none';
          // Reload page to show updated data
          window.location.reload();
        } else {
          alert(result.message || 'Error updating flashcard');
        }
      } catch (error) {
        console.error('Error updating flashcard:', error);
        alert('Something went wrong!');
      }
    });
  }
}

// Function to initialize delete flashcard functionality
function initializeDeleteFlashcards() {
  const deleteBtns = document.querySelectorAll('.delete-btn');
  const confirmDeleteModal = document.getElementById('confirmDeleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  
  if (!confirmDeleteModal || !confirmDeleteBtn || !cancelDeleteBtn) {
    console.log("Delete flashcard elements not found");
    return;
  }
  
  let currentCardToDelete = null;
  
  // Attach event listeners for delete buttons
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Stop event propagation to prevent triggering parent events
      e.stopPropagation();
      
      // Only process this if it's a flashcard delete button (in the flashcard footer)
      if (!this.closest('.flashcard-footer')) {
        return;
      }
      
      currentCardToDelete = this.getAttribute('data-id');
      console.log('Flashcard delete button clicked for card ID:', currentCardToDelete);
      confirmDeleteModal.style.display = 'flex';
    });
  });
  
  // Cancel delete
  cancelDeleteBtn.addEventListener('click', function() {
    confirmDeleteModal.style.display = 'none';
    currentCardToDelete = null;
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === confirmDeleteModal) {
      confirmDeleteModal.style.display = 'none';
      currentCardToDelete = null;
    }
  });
  
  // Confirm delete
  confirmDeleteBtn.addEventListener('click', async function() {
    if (!currentCardToDelete) {
      console.error('No card ID to delete');
      return;
    }
    
    console.log('Attempting to delete card ID:', currentCardToDelete);
    
    try {
      const response = await fetch(`/flashcard/${currentCardToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        // If parsing fails, create a default result
        result = { status: 'success', message: 'Flashcard deleted successfully' };
      }
      
      // Close modal
      confirmDeleteModal.style.display = 'none';
      
      // Remove flashcard from DOM
      const flashcardElem = document.querySelector(`.flashcard-item[data-id="${currentCardToDelete}"]`);
      if (flashcardElem) {
        flashcardElem.remove();
        
        // Check if category is now empty
        const categorySection = flashcardElem.closest('.category-section');
        if (categorySection) {
          const remainingCards = categorySection.querySelectorAll('.flashcard-item');
          
          // Update category count
          const countElement = categorySection.querySelector('.category-count');
          if (countElement) {
            countElement.textContent = `(${remainingCards.length} words)`;
          }
          
          if (remainingCards.length === 0) {
            categorySection.remove();
            
            // Check if there are any flashcards left
            const categorySections = document.querySelectorAll('.category-section');
            if (categorySections.length === 0) {
              // Show empty state
              const manageContainer = document.querySelector('.manage-container');
              manageContainer.innerHTML = `
                <div class="stats-banner">
                  <h1>Memory Vault</h1>
                  <p class="total-count">Total Words: 0</p>
                </div>
                <div class="empty-state">
                  <a href="/forge" class="create-button">Forge Your First Memory</a>
                </div>
              `;
            } else {
              // Update total count
              updateTotalCount();
            }
          } else {
            // Update total count
            updateTotalCount();
          }
        }
      } else {
        // Reload page if the DOM update fails
        window.location.reload();
      }
      
      // Reset currentCardToDelete
      currentCardToDelete = null;
      
    } catch (error) {
      console.error('Error details:', error);
      // Close modal anyway - the delete probably succeeded
      confirmDeleteModal.style.display = 'none';
      // Reload page to be safe
      window.location.reload();
    }
  });
}

// Function to initialize toggle buttons
function initializeToggleButtons() {
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Stop event propagation
      e.stopPropagation();
      
      const categorySection = this.closest('.category-section');
      const flashcardsGrid = categorySection.querySelector('.flashcards-grid');
      
      if (flashcardsGrid.style.display === 'none') {
        flashcardsGrid.style.display = '';
        this.textContent = 'Hide';
      } else {
        flashcardsGrid.style.display = 'none';
        this.textContent = 'Show';
      }
    });
  });
}

// Function to initialize category deletion
function initializeCategoryDeletion() {
  const deleteCategoryBtns = document.querySelectorAll('.delete-category-btn');
  const confirmDeleteCategoryModal = document.getElementById('confirmDeleteCategoryModal');
  const confirmDeleteCategoryBtn = document.getElementById('confirmDeleteCategoryBtn');
  const cancelDeleteCategoryBtn = document.getElementById('cancelDeleteCategoryBtn');
  const categoryNameToDelete = document.getElementById('categoryNameToDelete');
  
  if (!confirmDeleteCategoryModal || !confirmDeleteCategoryBtn || !cancelDeleteCategoryBtn) {
    console.log("Category delete elements not found");
    return;
  }
  
  let currentCategoryToDelete = null;
  
  // Open delete category confirmation modal
  deleteCategoryBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Stop event propagation to prevent triggering parent events
      e.stopPropagation();
      
      currentCategoryToDelete = this.getAttribute('data-catid');
      const categoryName = this.getAttribute('data-name');
      categoryNameToDelete.textContent = categoryName;
      confirmDeleteCategoryModal.style.display = 'flex';
      
      // Prevent event from bubbling up to other handlers
      e.stopPropagation();
    });
  });
  
  // Cancel delete category
  cancelDeleteCategoryBtn.addEventListener('click', function() {
    confirmDeleteCategoryModal.style.display = 'none';
    currentCategoryToDelete = null;
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === confirmDeleteCategoryModal) {
      confirmDeleteCategoryModal.style.display = 'none';
      currentCategoryToDelete = null;
    }
  });
  
  // Confirm delete category
  confirmDeleteCategoryBtn.addEventListener('click', function() {
    if (!currentCategoryToDelete) {
      console.error('No category ID to delete');
      return;
    }
    
    console.log('Deleting category:', currentCategoryToDelete);
    
    fetch(`/category/${currentCategoryToDelete}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.text())
    .then(text => {
      console.log("Raw response:", text);
      // Just check if the response contains "success"
      if (text.includes('success')) {
        confirmDeleteCategoryModal.style.display = 'none';
        window.location.reload();
      } else {
        try {
          const data = JSON.parse(text);
          alert(data.message || 'Error deleting category');
        } catch (e) {
          // If parsing fails, still reload if it looks successful
          confirmDeleteCategoryModal.style.display = 'none';
          window.location.reload();
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      // Try to reload anyway, the operation might have succeeded
      confirmDeleteCategoryModal.style.display = 'none';
      window.location.reload();
    });
  });
}

// Function to handle flash messages
function initializeFlashMessages() {
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(message => {
    setTimeout(() => {
      message.remove();
    }, 5000);
  });
}

// Function to update total word count
function updateTotalCount() {
  const totalCountElement = document.querySelector('.total-count');
  if (totalCountElement) {
    const allCards = document.querySelectorAll('.flashcard-item');
    totalCountElement.textContent = `Total Words: ${allCards.length}`;
  }
}

// Form validation function
function validateEditForm() {
  const editWordElement = document.getElementById('editWord');
  const editWordTypeElement = document.getElementById('editWordType');
  const editMeaningElement = document.getElementById('editMeaning');
  const editExampleElement = document.getElementById('editExample');
  const editWordLevelElement = document.getElementById('editWordLevel');
  const editCategoryElement = document.getElementById('editCategory');
  
  // Check if all elements exist
  if (!editWordElement || !editWordTypeElement || !editMeaningElement || 
      !editExampleElement || !editWordLevelElement || !editCategoryElement) {
    console.error('Form elements not found');
    return false;
  }
  
  const word = editWordElement.value.trim();
  const wordType = editWordTypeElement.value;
  const meaning = editMeaningElement.value.trim();
  const example = editExampleElement.value.trim();
  const wordLevel = editWordLevelElement.value;
  const category = editCategoryElement.value;
  
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
  
  return true;
}