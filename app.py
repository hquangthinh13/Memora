from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import database as db
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For flash messages and session

# Login decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('memorizing'))
    return redirect(url_for('login'))

# Auth routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        success, result = db.verify_user(username, password)
        
        if success:
            session['user_id'] = result
            session['username'] = username
            # flash('Login successful!')
            return redirect(url_for('memorizing'))
        else:
            flash(result)
    
    return render_template('auth.html', page='login')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match')
            return render_template('auth.html', page='register')
        
        success, result = db.create_user(username, password)
        
        if success:
            # flash('Registration successful! Please log in.')
            return redirect(url_for('login'))
        # else:
        #     # flash(result)
    
    return render_template('auth.html', page='register')

@app.route('/logout')
def logout():
    session.clear()
    # flash('You have been logged out')
    return redirect(url_for('login'))

# Flashcard routes
@app.route('/forge', methods=['GET'])
@login_required
def forge():
    categories = db.get_user_categories(session['user_id'])
    return render_template('forge.html', categories=categories)

@app.route('/submit-flashcard', methods=['POST'])
@login_required
def submit_flashcard():
    data = request.json
    user_id = session['user_id']
    
    # Validate data
    vocab_word = data.get('VocabWord', '').strip()
    word_type = data.get('WordType', '')
    meaning = data.get('Meaning', '').strip()
    example = data.get('Example', '').strip()
    word_level = data.get('WordLevel', '')
    
    # Server-side validation
    if not vocab_word or len(vocab_word) > 100:
        return jsonify({"status": "error", "message": "Word is required and must be 100 characters or less"}), 400
        
    if not word_type:
        return jsonify({"status": "error", "message": "Word type is required"}), 400
        
    if not meaning or len(meaning) > 4000:
        return jsonify({"status": "error", "message": "Meaning is required and must be 4000 characters or less"}), 400
        
    if example and len(example) > 4000:
        return jsonify({"status": "error", "message": "Example must be 4000 characters or less"}), 400
        
    if not word_level:
        return jsonify({"status": "error", "message": "Word level is required"}), 400
    
    # Handle new category
    if data['Category'] == 'add_new':
        category_name = data.get('CustomCategory', '').strip()
        if not category_name:
            return jsonify({"status": "error", "message": "Category name cannot be empty"}), 400
        
        success, cat_id = db.create_category(user_id, category_name)
        if not success:
            return jsonify({"status": "error", "message": cat_id}), 400
    else:
        cat_id = data['Category']
    
    # Create flashcard
    success, result = db.create_flashcard(
        user_id, 
        cat_id,
        vocab_word,
        word_type,
        meaning,
        example,
        word_level
    )
    
    if success:
        return jsonify({"status": "success", "message": "Flashcard created successfully"}), 200
    else:
        return jsonify({"status": "error", "message": result}), 400

@app.route('/memorizing')
@login_required
def memorizing():
    user_id = session['user_id']
    flashcards = db.get_user_flashcards(user_id)
    
    # Prepare flashcards in the format needed by the JavaScript
    formatted_flashcards = []
    for card in flashcards:
        formatted_flashcards.append({
            'word': card['vocabword'],
            'type': card['wordtype'],
            'meaning': card['meaning'],
            'example': card.get('example', ''),
            'level': card['wordlevel'],
            'category': card['categoryname']
        })
    
    return render_template('memorizing.html', flashcards=formatted_flashcards)

@app.route('/manage')
@login_required
def manage():
    user_id = session['user_id']
    flashcards = db.get_user_flashcards(user_id)
    categories = db.get_user_categories(user_id)
    
    # Format categories for easier use in templates
    categories_dict = {cat[0]: {'name': cat[1], 'count': cat[2]} for cat in categories}
    
    # Calculate total flashcard count
    total_flashcard_count = sum(cat[2] for cat in categories)
    
    # Group flashcards by category
    categorized_flashcards = {}
    for card in flashcards:
        category_name = card['categoryname']
        if category_name not in categorized_flashcards:
            categorized_flashcards[category_name] = []
        categorized_flashcards[category_name].append(card)
    
    return render_template('manage.html', 
                          categorized_flashcards=categorized_flashcards, 
                          categories=categories,
                          categories_dict=categories_dict,
                          total_flashcard_count=total_flashcard_count)

@app.route('/flashcard/<int:card_id>', methods=['PUT', 'DELETE'])
@login_required
def flashcard_actions(card_id):
    user_id = session['user_id']
    
    if request.method == 'PUT':
        data = request.json
        
        # Validate data
        vocab_word = data.get('vocabWord', '').strip()
        word_type = data.get('wordType', '')
        meaning = data.get('meaning', '').strip()
        example = data.get('example', '').strip()
        word_level = data.get('wordLevel', '')
        category_id = data.get('categoryId', '')
        
        # Server-side validation
        if not vocab_word or len(vocab_word) > 100:
            return jsonify({"status": "error", "message": "Word is required and must be 100 characters or less"}), 400
            
        if not word_type:
            return jsonify({"status": "error", "message": "Word type is required"}), 400
            
        if not meaning or len(meaning) > 4000:
            return jsonify({"status": "error", "message": "Meaning is required and must be 4000 characters or less"}), 400
            
        if example and len(example) > 4000:
            return jsonify({"status": "error", "message": "Example must be 4000 characters or less"}), 400
            
        if not word_level:
            return jsonify({"status": "error", "message": "Word level is required"}), 400
            
        if not category_id:
            return jsonify({"status": "error", "message": "Category is required"}), 400
        
        success, message = db.update_flashcard(
            card_id,
            user_id, 
            vocab_word,
            word_type,
            meaning,
            example,
            word_level,
            category_id
        )
        
        if success:
            return jsonify({"status": "success", "message": message}), 200
        else:
            return jsonify({"status": "error", "message": message}), 400
            
    elif request.method == 'DELETE':
        print(f"Attempting to delete card ID: {card_id} for user: {user_id}")
        success, message = db.delete_flashcard(card_id, user_id)
        
        if success:
            print(f"Successfully deleted card: {card_id}")
            return jsonify({"status": "success", "message": message}), 200
        else:
            print(f"Failed to delete card: {card_id}, reason: {message}")
            return jsonify({"status": "error", "message": message}), 400

@app.route('/category/<int:cat_id>', methods=['DELETE'])
@login_required
def category_actions(cat_id):
    user_id = session['user_id']
    
    if request.method == 'DELETE':
        print(f"Attempting to delete category {cat_id} for user {user_id}")
        success, message = db.delete_category(cat_id, user_id)
        
        if success:
            print(f"Successfully deleted category: {cat_id}")
            return jsonify({"status": "success", "message": message}), 200
        else:
            print(f"Failed to delete category: {cat_id}, reason: {message}")
            return jsonify({"status": "error", "message": message}), 400

if __name__ == '__main__':
    app.run(debug=True)