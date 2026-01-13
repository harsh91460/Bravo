const mongoose = require('mongoose');
const Question = require('./models/Question');

mongoose.connect("mongodb://localhost:27017/codingbattle", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("Connected to MongoDB");

  // Pahle saare questions delete kar dete hain
  await Question.deleteMany({});

  // Sample questions
  const questions = [
    {
      title: "Sum of Two Numbers",
      description: "Given two numbers, print their sum.",
      difficulty: "easy",
      tags: ["math", "basics"],
      inputFormat: "Two integers a and b.",
      outputFormat: "Single integer, the sum of a and b.",
      constraints: "1 <= a, b <= 10^9",
      sampleInput: "3 5",
      sampleOutput: "8",
      testCases: [
        { input: "1 2", output: "3" },
        { input: "10 20", output: "30" }
      ]
    },
    {
      title: "Find Maximum Element",
      description: "Find the maximum element in an array.",
      difficulty: "medium",
      tags: ["arrays"],
      inputFormat: "First line contains N, size of array. Next line contains N integers.",
      outputFormat: "Print the maximum integer.",
      constraints: "1 <= N <= 10^5, -10^9 <= arr[i] <= 10^9",
      sampleInput: "5\n1 4 3 7 2",
      sampleOutput: "7",
      testCases: [
        { input: "3\n-1 0 -5", output: "0" },
        { input: "4\n10 10 10 10", output: "10" }
      ]
    }
  ];

  // Insert sample questions
  await Question.insertMany(questions);
  console.log("Sample questions inserted");
  mongoose.disconnect();
})
.catch((err) => {
  console.error("Error seeding questions:", err);
  mongoose.disconnect();
});
