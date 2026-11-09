const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/expenses", (req, res) => {
  db.all("SELECT * FROM expenses ORDER BY date DESC, id DESC", (err, expenses) => {
    if (err) return res.status(500).json({ error: "Could not fetch expenses." });
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    res.json({ expenses, total });
  });
});

app.post("/api/expenses", (req, res) => {
  const { title, amount, category } = req.body || {};
  const numericAmount = Number(amount);
  if (typeof title !== "string" || !title.trim() ||
      typeof category !== "string" || !category.trim() ||
      amount === "" || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Enter a title, category, and amount greater than zero." });
  }

  db.run("INSERT INTO expenses (title, amount, category) VALUES (?, ?, ?)",
    [title.trim(), numericAmount, category.trim()], function (err) {
      if (err) return res.status(500).json({ error: "Could not add expense." });
      db.get("SELECT * FROM expenses WHERE id = ?", [this.lastID], (getErr, expense) => {
        if (getErr) return res.status(500).json({ error: "Could not read the new expense." });
        res.status(201).json(expense);
      });
    });
});

app.delete("/api/expenses/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid expense ID." });
  db.run("DELETE FROM expenses WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Could not delete expense." });
    if (!this.changes) return res.status(404).json({ error: "Expense not found." });
    res.json({ message: "Expense deleted." });
  });
});

app.listen(PORT, () => console.log(`Expense Tracker running at http://localhost:${PORT}`));
