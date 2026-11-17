/**
 * Test set for answer reuse (scripts/eval-reuse.ts). Three fictional buyers ask one factory about the same
 * subjects in their own words. Buyer A's 20 questions are already answered. Each of B's and C's questions is
 * labelled with the A question it repeats, or null when it looks similar but asks something else (a different
 * number, period, detail or kind of answer), where reusing A's answer would be wrong.
 * Written by the Bunon team for testing; not taken from any real buyer's questionnaire.
 */
export const BUYER_A: Array<{ id: string; text: string }> = [
  { id: "A01", text: "Does the factory hold a valid fire licence?" },
  { id: "A02", text: "When was the last fire evacuation drill held?" },
  { id: "A03", text: "Are fire extinguishers inspected every month?" },
  { id: "A04", text: "Has an independent structural safety assessment of the building been completed?" },
  { id: "A05", text: "Are all workers paid at least the legal minimum wage?" },
  { id: "A06", text: "Are wages paid on time every month?" },
  { id: "A07", text: "Are overtime hours paid at a premium rate?" },
  { id: "A08", text: "What is the maximum number of working hours per week, including overtime?" },
  { id: "A09", text: "Is overtime voluntary?" },
  { id: "A10", text: "Does the factory employ anyone under the age of 18?" },
  { id: "A11", text: "Is there a procedure to verify workers' age at recruitment?" },
  { id: "A12", text: "Can workers raise grievances anonymously?" },
  { id: "A13", text: "Is there an elected worker participation committee?" },
  { id: "A14", text: "Does the factory have a written anti-harassment policy?" },
  { id: "A15", text: "How many workers does the factory employ?" },
  { id: "A16", text: "What percentage of the workforce is female?" },
  { id: "A17", text: "Do workers receive paid maternity leave?" },
  { id: "A18", text: "Is drinking water available to workers on every floor?" },
  { id: "A19", text: "Are chemicals stored with safety data sheets?" },
  { id: "A20", text: "Is any of the cotton you use certified organic?" },
];

export const LATER_BUYERS: Array<{ buyer: "B" | "C"; text: string; repeats: string | null }> = [
  // Buyer B: the same questions in other words
  { buyer: "B", text: "Is the factory's fire licence currently valid?", repeats: "A01" },
  { buyer: "B", text: "Has an independent engineer assessed the building's structure?", repeats: "A04" },
  { buyer: "B", text: "Do all employees earn at least the statutory minimum wage?", repeats: "A05" },
  { buyer: "B", text: "Is overtime work voluntary for all workers?", repeats: "A09" },
  { buyer: "B", text: "Are any workers younger than 18 years old?", repeats: "A10" },
  { buyer: "B", text: "Do you verify the age of every worker at recruitment?", repeats: "A11" },
  { buyer: "B", text: "Can workers make complaints without revealing their identity?", repeats: "A12" },
  { buyer: "B", text: "How many people work at the factory in total?", repeats: "A15" },
  { buyer: "B", text: "Are salaries paid on time each month?", repeats: "A06" },
  { buyer: "B", text: "Is there a worker participation committee elected by workers?", repeats: "A13" },
  { buyer: "B", text: "Do you have a written policy against harassment?", repeats: "A14" },
  { buyer: "B", text: "Are safety data sheets kept for all chemicals in storage?", repeats: "A19" },
  // Buyer B: similar, but a different question
  { buyer: "B", text: "When does the fire licence expire?", repeats: null },
  { buyer: "B", text: "Are fire drills held every three months?", repeats: null },
  { buyer: "B", text: "Are wages paid in cash or by bank transfer?", repeats: null },
  { buyer: "B", text: "Is overtime limited to 2 hours per day?", repeats: null },
  { buyer: "B", text: "Does the factory employ any workers under the age of 16?", repeats: null },
  { buyer: "B", text: "What percentage of workers are under 25?", repeats: null },
  { buyer: "B", text: "Are fire exits kept unlocked during working hours?", repeats: null },
  { buyer: "B", text: "Do you use recycled polyester?", repeats: null },
  // Buyer C: the same questions in other words
  { buyer: "C", text: "Does the facility have a valid fire safety licence?", repeats: "A01" },
  { buyer: "C", text: "When did the factory last hold an evacuation drill?", repeats: "A02" },
  { buyer: "C", text: "Has the building had an independent structural assessment?", repeats: "A04" },
  { buyer: "C", text: "Is every worker paid at least the legal minimum wage?", repeats: "A05" },
  { buyer: "C", text: "Are overtime hours paid at a higher rate than normal hours?", repeats: "A07" },
  { buyer: "C", text: "What is the most hours a worker can work in one week, overtime included?", repeats: "A08" },
  { buyer: "C", text: "Do you employ any child workers under 18?", repeats: "A10" },
  { buyer: "C", text: "Is there a way for workers to report grievances anonymously?", repeats: "A12" },
  { buyer: "C", text: "What share of the workers are women?", repeats: "A16" },
  { buyer: "C", text: "Do female workers get paid maternity leave?", repeats: "A17" },
  { buyer: "C", text: "Is safe drinking water provided on each floor?", repeats: "A18" },
  { buyer: "C", text: "Is the cotton you use certified organic?", repeats: "A20" },
  // Buyer C: similar, but a different question
  { buyer: "C", text: "Are fire extinguishers refilled every year?", repeats: null },
  { buyer: "C", text: "Has the building's electrical system been inspected in the last 12 months?", repeats: null },
  { buyer: "C", text: "Are workers paid a festival bonus twice a year?", repeats: null },
  { buyer: "C", text: "Is overtime ever required on Fridays?", repeats: null },
  { buyer: "C", text: "How many workers left the factory last year?", repeats: null },
  { buyer: "C", text: "Is there a written grievance procedure?", repeats: null },
  { buyer: "C", text: "Are workers allowed to form a trade union?", repeats: null },
  { buyer: "C", text: "Is drinking water tested for safety?", repeats: null },
];
