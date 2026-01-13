const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'easy' },
  tags: [String],
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  sampleInput: String,
  sampleOutput: String,
  testCases: [{ input: String, output: String }],
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
