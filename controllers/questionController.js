const pool = require('../config/db');

//Creating a question
exports.createQuestion = async (req, res) => {
  try {
    const { category_id, question_text, question_type, points, answers, correct } = req.body;
    
    const created_by = req.session.user.id; 

    let answersJson = null;
    let correctJson = null;
    if (answers !== undefined) answersJson = JSON.stringify(answers);
    if (correct !== undefined) correctJson = JSON.stringify(correct);

    const [result] = await pool.query(
      'INSERT INTO questions (category_id, question_text, question_type, points) VALUES (?, ?, ?, ?)',
      [category_id, question_text, question_type, points || 1]
    );
    const question_id = result.insertId;

    if (question_type === 'multiple_choice' && Array.isArray(answers)) {
      for (const ans of answers) {
        await pool.query(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
          [question_id, ans.answer_text, !!ans.is_correct]
        );
      }
    } else if (question_type === 'true_false') {
      const trueText = "Да";
      const falseText = "Не";
      await pool.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?), (?, ?, ?)',
        [
          question_id, trueText, correct === trueText || correct === true || correct === "true" ? 1 : 0,
          question_id, falseText, correct === falseText || correct === false || correct === "false" ? 1 : 0
        ]
      );
    }
    res.json({ message: 'Въпросът е създаден успешно!', questionId: question_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Reading all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.id,
             q.question_text,
             q.question_type,
             q.category_id,
             c.name AS category_name
      FROM questions q
      JOIN category c ON q.category_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Reading a question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Editing a question
exports.updateQuestion = async (req, res) => {
  try {
    const { category_id, question_text, question_type, points, answers, correct } = req.body;

    // 1. Update the question itself
    await pool.query(
      'UPDATE questions SET category_id = ?, question_text = ?, question_type = ?, points = ? WHERE id = ?',
      [category_id, question_text, question_type, points || 1, req.params.id]
    );

    // 2. Delete old answers
    await pool.query('DELETE FROM answers WHERE question_id = ?', [req.params.id]);

    // 3. Add new answers
    if (question_type === 'multiple_choice' && Array.isArray(answers)) {
      for (const ans of answers) {
        await pool.query(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
          [req.params.id, ans.answer_text, !!ans.is_correct]
        );
      }
    } else if (question_type === 'true_false') {
      // correct  should be "Да" or "Не" (or true/false)
      const trueText = "Да";
      const falseText = "Не";
      await pool.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?), (?, ?, ?)',
        [
          req.params.id, trueText, correct === trueText || correct === true || correct === "true" ? 1 : 0,
          req.params.id, falseText, correct === falseText || correct === false || correct === "false" ? 1 : 0
        ]
      );
    }
   

    res.json({ message: 'Въпросът е обновен успешно!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Deleting a question
exports.deleteQuestion = async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Returning all categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM category');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const [questions] = await pool.query('SELECT * FROM questions');
    for (let q of questions) {
      if (q.question_type === 'multiple_choice') {
        const [answers] = await pool.query('SELECT id, answer_text, is_correct FROM answers WHERE question_id = ?', [q.id]);
        q.answers = answers;
      }
    }
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Adding a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Името на категорията е твърде кратко.' });
    }
    // Check for duplication
    const [exists] = await pool.query('SELECT id FROM category WHERE name = ?', [name.trim()]);
    if (exists.length > 0) {
      return res.status(400).json({ message: 'Тази категория вече съществува.' });
    }
    const [result] = await pool.query('INSERT INTO category (name) VALUES (?)', [name.trim()]);
    res.json({ id: result.insertId, name: name.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Възникна грешка при създаване на категория.' });
  }
};

// Returns N random questions by category
exports.getRandomQuestionsByCategory = async (req, res) => {
  try {
    const { category_id, count } = req.query;
    if (!category_id || !count) {
      return res.status(400).json({ message: 'Липсва категория или брой.' });
    }
    // Проверка за достатъчно въпроси
    const [all] = await pool.query(
      'SELECT COUNT(*) as total FROM questions WHERE category_id = ?',
      [category_id]
    );
    if (all[0].total < parseInt(count)) {
      return res.status(400).json({ message: `В категорията има само ${all[0].total} въпроса.` });
    }
    const [rows] = await pool.query(
      `SELECT q.id, q.question_text, q.question_type, q.category_id, c.name AS category_name
       FROM questions q
       JOIN category c ON q.category_id = c.id
       WHERE q.category_id = ?
       ORDER BY RAND()
       LIMIT ?`,
      [category_id, parseInt(count)]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Редакция на категория
exports.updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Името на категорията е твърде кратко.' });
    }
    await pool.query('UPDATE category SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ message: 'Категорията е обновена успешно!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Възникна грешка при редакция на категория.' });
  }
};

// Изтриване на категория
exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM category WHERE id = ?', [id]);
    res.json({ message: 'Категорията е изтрита успешно!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Възникна грешка при изтриване на категория.' });
  }
};
