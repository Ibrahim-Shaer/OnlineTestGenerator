const pool = require('../config/db');

exports.createQuestion = async (req, res) => {
  try {
    const { category_id, question_text, question_type } = req.body;
    // Ако имаш колона "created_by" в таблицата "questions", запиши кой е админът:
    const created_by = req.session.user.id; 

    const [result] = await pool.query(
      'INSERT INTO questions (category_id, question_text, question_type, created_by) VALUES (?, ?, ?, ?)',
      [category_id, question_text, question_type, created_by]
    );
    res.json({ message: 'Question created', questionId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.id,
             q.question_text,
             q.question_type,
             q.category_id,
             c.name AS category_name
      FROM questions q
      JOIN categories c ON q.category_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


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

exports.updateQuestion = async (req, res) => {
  try {
    const { category_id, question_text, question_type } = req.body;
    await pool.query(
      'UPDATE questions SET category_id = ?, question_text = ?, question_type = ? WHERE id = ?',
      [category_id, question_text, question_type, req.params.id]
    );
    res.json({ message: 'Question updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
