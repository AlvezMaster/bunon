/** Reworded and Bangla questions for testing retrieval, with the demo document that should answer each. */
export const RAG_TEST: Array<{ q: string; doc: string }> = [
  { q: "Is there an up-to-date licence from the fire service?", doc: "fire-licence" },
  { q: "How recently did staff practise evacuating the building?", doc: "fire-licence" },
  { q: "Do employees earn at least what the law requires?", doc: "wage-policy" },
  { q: "What is the cap on weekly hours when extra shifts are included?", doc: "working-hours" },
  { q: "Can staff refuse extra hours without being punished?", doc: "working-hours" },
  { q: "Do you use child workers?", doc: "child-labour" },
  { q: "How do you check how old new hires are?", doc: "child-labour" },
  { q: "Is there a way for workers to complain without giving their name?", doc: "grievance" },
  { q: "Has a structural engineer inspected the premises?", doc: "building-safety" },
  { q: "Are salaries paid on schedule?", doc: "wage-policy" },
  { q: "How large is your workforce?", doc: "headcount" },
  { q: "Is your cotton certified organic?", doc: "gots-yarn-2024" },
  { q: "কারখানার কি বৈধ অগ্নি লাইসেন্স আছে?", doc: "fire-licence" },
  { q: "শ্রমিকদের কি ন্যূনতম মজুরি দেওয়া হয়?", doc: "wage-policy" },
  { q: "ওভারটাইম কি স্বেচ্ছায় করা হয়?", doc: "working-hours" },
  { q: "কারখানায় কি ১৮ বছরের কম বয়সী কেউ কাজ করে?", doc: "child-labour" },
];
