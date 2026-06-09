-- Migration 012: add branch_id to expenses
-- NULL = legacy expenses; all new expenses require a branch

ALTER TABLE expenses ADD COLUMN branch_id UUID REFERENCES branches(id);

CREATE INDEX idx_expenses_branch_id ON expenses(branch_id);
