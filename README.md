# Brojogopal Sapui — AI Security Website Template

This is a personalized static website starter designed for GitHub Pages.

## Included pages
- Home
- About
- Research overview
- Ongoing Work
- Publications
- Contact
- Dedicated AI security section pages
- Short “Research Watch” post pages

0. Start from your local repo root

Open Git Bash in your repo folder:

cd /c/Users/Brojogopal.Sapui/Documents/personal_work/Git_workspace/AISecurityResearch
1. First sync with GitHub

Do this before editing anything:

git pull origin main

Use this rule:

If you have not started editing yet → git pull first
If you already changed files locally → do not pull first; finish, commit, then push
2. Get one research paper

You can keep the PDF locally for your own reading, but you do not need to push it to GitHub unless you want to archive papers publicly.

Suggested local folder:

papers_articles/
3. Ask ChatGPT to create the filled DOCX

Your prompt can be like:

I am attaching one research paper PDF and my weekly research watch template DOCX. Fill the DOCX in the required format so that my notebook can parse it and generate the new website update.

Then save the generated DOCX in:

weekly-inputs/

Use this naming style:

YYYY-MM-topic-name.docx

Example:

weekly-inputs/2026-03-embodied-ai-security-governance.docx

This filename is important because the notebook uses it to keep naming consistent.

4. Run the notebook

Open this notebook from the repo root:

update_ongoing_work_and_home_from_docx_posts_consistent_fixed.ipynb

Then Run All.

What it will do automatically

From that one DOCX, it will:

update index.html
update ongoing-work.html

create/update:

posts/YYYY-MM-topic-name.html
Important

Run the notebook inside the real repo folder, not in some separate temp folder.

5. Check the generated result locally

Open in browser:

index.html
ongoing-work.html
the new file in posts/

Check:

homepage floating Research Watch updated
ongoing-work note added at top
accordion works
full post page exists
links work
6. Check Git changes

Now run:

git status

You should normally see changes in:

index.html
ongoing-work.html
posts/YYYY-MM-topic-name.html
weekly-inputs/YYYY-MM-topic-name.docx

You usually do not need to add:

notebook .ipynb file, unless you actually changed the notebook code
.ipynb_checkpoints/
raw PDF paper
7. Add only the needed files

Example:

git add index.html
git add ongoing-work.html
git add posts/2026-03-embodied-ai-security-governance.html
git add weekly-inputs/2026-03-embodied-ai-security-governance.docx

If you changed nothing else, that is enough.

8. Commit

Use a clear message:

git commit -m "Add weekly research watch on embodied AI security and governance"
9. Push
git push origin main

Then wait a little and refresh your site.

Very short memory version
Every week do this:
git pull origin main
get paper
ask ChatGPT to fill the DOCX template
save DOCX in weekly-inputs/YYYY-MM-topic-name.docx
run notebook
check index.html, ongoing-work.html, and posts/...html
git status
git add only needed files
git commit -m "..."
git push origin main
What files are normally updated each week
Required
index.html
ongoing-work.html
posts/YYYY-MM-topic-name.html
weekly-inputs/YYYY-MM-topic-name.docx
Usually not needed
notebook .ipynb
PDF paper
template DOCX
_internal/ files
One important rule about git pull

Do not do this:

edit files
then git pull

That can create conflicts.

So always remember:

Safe order
first git pull
then edit / run notebook
then git add
git commit
git push
Suggested commit message format

Use:

Add weekly research watch on [topic]

Examples:

Add weekly research watch on embodied AI security and governance
Add weekly research watch on STACK safeguard pipeline attacks
Recommended local folder structure
AISecurityResearch/
  index.html
  ongoing-work.html
  assets/
  posts/
  weekly-inputs/
  papers_articles/
  update_ongoing_work_and_home_from_docx_posts_consistent_fixed.ipynb
Best practical habit

Keep a small note for yourself:

Each week:
one paper
one filled DOCX
one notebook run
one commit
one push

That keeps everything simple and consistent.
