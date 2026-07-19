"""
Builds docs/Cadence-Getting-Started.pdf — the customer-facing onboarding guide.

    python scripts/build-guide-pdf.py

Note on characters: ReportLab's built-in fonts use WinAnsi encoding, which has
no emoji and no arrow glyphs. Anything outside that set renders as a black box,
so this document deliberately sticks to plain text plus em dashes and bullets.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUT = "docs/Cadence-Getting-Started.pdf"

ACCENT = colors.HexColor("#4f46e5")
INK = colors.HexColor("#18181b")
MUTED = colors.HexColor("#71717a")
RULE = colors.HexColor("#d4d4d8")
PANEL = colors.HexColor("#f4f4f5")
QUOTE_BG = colors.HexColor("#eef2ff")
WARN_BG = colors.HexColor("#fff7ed")
WARN_EDGE = colors.HexColor("#ea580c")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

ss = getSampleStyleSheet()


def style(name, **kw):
    kw.setdefault("parent", ss["Normal"])
    return ParagraphStyle(name, **kw)


S_TITLE = style("t", fontName="Helvetica-Bold", fontSize=30, leading=34, textColor=INK)
S_SUB = style("s", fontName="Helvetica", fontSize=13, leading=18, textColor=MUTED)
S_H1 = style("h1", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=INK,
             spaceBefore=16, spaceAfter=7)
S_H2 = style("h2", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=INK,
             spaceBefore=11, spaceAfter=4)
S_BODY = style("b", fontName="Helvetica", fontSize=10, leading=15, textColor=INK,
               spaceAfter=7, alignment=TA_LEFT)
S_BULLET = style("bl", parent=S_BODY, leftIndent=12, bulletIndent=2, spaceAfter=3)
S_CELL = style("c", fontName="Helvetica", fontSize=9, leading=12.5, textColor=INK)
S_CELL_B = style("cb", parent=S_CELL, fontName="Helvetica-Bold")
S_QUOTE = style("q", fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
                textColor=INK, leftIndent=8, rightIndent=8,
                spaceBefore=4, spaceAfter=4)
S_NOTE = style("n", fontName="Helvetica", fontSize=9.5, leading=14, textColor=INK,
               leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4)
S_FOOT = style("f", fontName="Helvetica", fontSize=8, textColor=MUTED)

story = []


def h1(text, anchor=None):
    story.append(Paragraph(f'<a name="{anchor}"/>{text}' if anchor else text, S_H1))
    story.append(rule())


def h2(text):
    story.append(Paragraph(text, S_H2))


def p(text):
    story.append(Paragraph(text, S_BODY))


def bullets(items):
    for i in items:
        story.append(Paragraph(i, S_BULLET, bulletText="•"))
    story.append(Spacer(1, 5))


def rule(color=RULE, thickness=0.6, space=5):
    t = Table([[""]], colWidths=[PAGE_W - 2 * MARGIN], rowHeights=[0.1])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), thickness, color),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), space),
    ]))
    return t


def table(rows, widths, header=True):
    data = []
    for r_i, row in enumerate(rows):
        st = S_CELL_B if (header and r_i == 0) else S_CELL
        data.append([Paragraph(str(c), st) for c in row])

    t = Table(data, colWidths=widths, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
    ]
    if header:
        cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), PANEL),
            ("LINEBELOW", (0, 0), (-1, 0), 0.8, RULE),
        ]
    t.setStyle(TableStyle(cmds))
    story.append(t)
    story.append(Spacer(1, 9))


def _box(paras, bg, edge):
    inner = []
    for text, st in paras:
        inner.append(Paragraph(text, st))
    t = Table([[inner]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, edge),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(KeepTogether([t, Spacer(1, 9)]))


def example(label, body):
    """A sample of real post copy."""
    _box([(f'<font color="#4f46e5"><b>{label}</b></font>', S_NOTE),
          (body, S_QUOTE)], QUOTE_BG, ACCENT)


def note(label, body):
    _box([(f"<b>{label}</b> {body}", S_NOTE)], PANEL, colors.HexColor("#a1a1aa"))


def warn(label, body):
    _box([(f'<font color="#ea580c"><b>{label}</b></font> {body}', S_NOTE)],
         WARN_BG, WARN_EDGE)


def decorate(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, 12 * mm, "Cadence - Getting Started")
        canvas.drawRightString(PAGE_W - MARGIN, 12 * mm, f"Page {doc.page - 1}")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, 15 * mm, PAGE_W - MARGIN, 15 * mm)
    canvas.restoreState()


# ---------------------------------------------------------------- cover -----

story.append(Spacer(1, 26 * mm))

logo = Table([[Paragraph('<font color="white"><b>C</b></font>',
                         style("lg", fontName="Helvetica-Bold", fontSize=22,
                               leading=26, alignment=1))]],
             colWidths=[13 * mm], rowHeights=[13 * mm], hAlign="LEFT")
logo.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
]))
story.append(logo)
story.append(Spacer(1, 10))
story.append(Paragraph("Cadence", S_TITLE))
story.append(Spacer(1, 4))
story.append(Paragraph("One board for every client.", S_SUB))
story.append(Spacer(1, 16))
story.append(rule(ACCENT, 2, 10))
story.append(Spacer(1, 6))
story.append(Paragraph("Getting Started", style(
    "gs", fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=ACCENT)))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "A step-by-step guide for social media managers and agencies. Follow it start "
    "to finish and you will have a client set up, a month of content planned, and "
    "your first post approved - in about 20 minutes.", S_BODY))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Throughout this guide we use one running example: onboarding a new client, "
    "<b>Willow &amp; Fig</b>, a neighbourhood plant shop.", S_BODY))

story.append(Spacer(1, 16))
story.append(Paragraph("What is inside", S_H2))
toc = [
    ["1.  Signing in", "9.   Working across all your clients"],
    ["2.  Adding your first client", "10.  Choosing your view"],
    ["3.  Creating a post", "11.  Recurring slots"],
    ["4.  Tailoring copy per platform", "12.  Never run out of ideas"],
    ["5.  Sending it for approval", "13.  Changing lots of posts at once"],
    ["6.  What your client sees", "14.  Keyboard shortcuts"],
    ["7.  Handling 'request changes'", "15.  A typical week"],
    ["8.  Scheduling and publishing", "16.  Questions and answers"],
]
t = Table(toc, colWidths=[(PAGE_W - 2 * MARGIN) / 2] * 2, hAlign="LEFT")
t.setStyle(TableStyle([
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
    ("TEXTCOLOR", (0, 0), (-1, -1), INK),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
]))
story.append(t)
story.append(PageBreak())

# ------------------------------------------------------------- sections -----

h1("1.  Signing in")
p("Open your Cadence address. You will be asked for your <b>workspace password</b>. "
  "Enter it and you are in. You stay signed in for 7 days on that device, so you "
  "will not be asked again every morning.")
note("Your clients never sign in",
     "and never need this password. They get their own link - see step 5.")
p("To sign out, use the exit icon at the far right of the top bar.")

h1("2.  Adding your first client")
p("A brand-new Cadence shows a single button: <b>Add your first client</b>. Click it, "
  "then fill in four things.")
table([
    ["Field", "Our example", "Why it matters"],
    ["Name", "Willow &amp; Fig", "Shown on every post card"],
    ["Industry", "Plant shop", "Used to tailor idea suggestions"],
    ["Accent colour", "Green", "This client's colour across the calendar"],
    ["Channels", "Instagram, TikTok, Facebook", "Only these appear when writing posts"],
], [30 * mm, 45 * mm, 95 * mm])
p("Click <b>Add client</b>.")
note("Choose accent colours deliberately.",
     "When every client shares one calendar, colour is how you tell them apart at a "
     "glance. Give clients you compare often clearly different colours. Avoid two greens.")
p("<b>What happens automatically:</b> Cadence creates a private approval link for this "
  "client straight away. You will use it in step 5.")

h1("3.  Creating a post")
p("Three ways to start: click <b>+ New post</b> in the top bar, press <b>N</b>, or "
  "hover any day on the calendar and click the small <b>+</b>.")
p("Let us plan a workshop announcement for Willow &amp; Fig.")
table([
    ["Field", "What we entered"],
    ["Client", "Willow &amp; Fig"],
    ["Date and time", "Saturday 2 August, 09:00"],
    ["Content type", "carousel"],
    ["Working title", "Terrarium workshop announcement"],
    ["Channels", "Instagram, Facebook"],
], [40 * mm, 130 * mm])
example("Base copy",
        "Hands in the dirt, snacks on the bench. Saturday 2pm we are building "
        "terrariums together - all materials included, beginners genuinely welcome. "
        "12 spots only. Link in bio.")
p("Click <b>Create draft</b>. The post appears on your calendar as a <b>Draft</b>, and "
  "its detail panel opens so you can refine it.")
note("The working title is for you, not the public.",
     "It is what you see on the calendar. 'Terrarium workshop announcement' is more "
     "useful at a glance than the first line of the caption.")

h1("4.  Tailoring copy for each platform")
p("This is where Cadence saves the most time. Write the idea once, then adjust it per "
  "platform - no retyping, no counting characters by hand. In the post panel you will "
  "see a <b>tab for each channel</b>. Click between them; each holds its own copy.")
example("Instagram tab (limit 2,200)",
        "Hands in the dirt, snacks on the bench. Saturday 2pm we are building "
        "terrariums together - all materials included, beginners genuinely welcome. "
        "<br/><br/>12 spots only. Link in bio.<br/><br/>"
        "#terrarium #plantshop #workshop")
example("Facebook tab (limit 5,000)",
        "Join us Saturday at 2pm for our terrarium building workshop. All materials "
        "are included and no experience is needed - our team will walk you through "
        "choosing plants, layering, and aftercare.<br/><br/>"
        "Spaces are limited to 12 so everyone gets hands-on time. Book through the "
        "link below.")
p("Same idea, two voices. Instagram is short and punchy with hashtags; Facebook is "
  "fuller and more explanatory.")
h2("Live character counters")
p("Every tab shows your count against that platform's real limit. Go over and it turns "
  "<b>red and bold</b> - so you find out before your client does, not after a caption "
  "gets truncated.")
table([
    ["Platform", "Limit", "Platform", "Limit"],
    ["X", "280", "LinkedIn", "3,000"],
    ["Instagram", "2,200", "Facebook", "5,000"],
    ["TikTok", "2,200", "YouTube", "5,000"],
], [35 * mm, 25 * mm, 35 * mm, 25 * mm])
p("Edit the title or any copy and a <b>Save changes</b> button appears. Click it. "
  "Status, date, and content type save instantly - no button needed.")

h1("5.  Sending it to your client for approval")
p("<b>Step 1 - mark it ready.</b> In the post panel, click <b>Request approval</b>. The "
  "status becomes <i>Needs approval</i> and the post is flagged as waiting on the client.")
p("<b>Step 2 - get their link.</b> Either <b>Copy client link</b> inside the post panel, "
  "or <b>manage</b> (next to 'Clients' in the sidebar), then <b>Copy approval link</b> "
  "next to the client's name.")
p("<b>Step 3 - send it.</b> Paste it into an email or WhatsApp:")
example("Example message",
        "Hi Maya - here is next month's content for review: "
        "https://your-cadence-address.com/share/...<br/><br/>"
        "You can approve each post or request changes right on the page. No login needed.")
note("Send it once.",
     "The link does not expire, so ask them to bookmark it. Everything you send for "
     "review from now on appears at that same address.")

h1("6.  What your client sees")
p("Your client opens the link - on a phone, laptop, whatever - and sees a clean page "
  "with their name at the top. <b>No account. No password. No app to install.</b>")
bullets([
    "<b>Waiting for your review</b> - only posts needing a decision",
    "The <b>exact copy for every channel</b>, so they know precisely what goes where",
    "<b>Coming up</b> - what is already approved and scheduled",
])
p("They type their name once (remembered next time), then on each post choose "
  "<b>Approve</b>, or <b>Request changes</b> which prompts them to say what should change.")
h2("What they cannot see")
p("Your calendar, your other clients, your rough drafts and ideas, your internal notes. "
  "The link only ever shows their brand, and only posts at the review stage. There is "
  "nothing to explain or train them on.")
table([
    ["Their action", "What you see on your board"],
    ["Approve", "Status becomes <b>Approved</b>, green tick on the card"],
    ["Request changes",
     "Status returns to <b>Draft</b>, flagged, and their note is added to the post's comments"],
], [45 * mm, 125 * mm])

h1("7.  Handling 'request changes'")
p("Say Maya replies:")
example("Client comment",
        "Love it - but can we say 15 spots? We opened up more room.")
p("Here is what happens:")
bullets([
    "The post returns to <b>Draft</b> and is flagged on your calendar.",
    "Her note appears in that post's <b>Comments</b>, highlighted so client feedback "
    "never gets lost among internal chatter.",
    "You open the post, change '12 spots' to '15 spots' in each channel tab, click "
    "<b>Save changes</b>, then <b>Request approval</b> again.",
    "She refreshes the same link and approves.",
])
note("Why this beats email.",
     "Every decision lives on the post itself - who approved it, when, and what was "
     "asked for. No more digging through threads to work out whether something was "
     "signed off.")
p("<b>Talking to your team:</b> use the comment box on any post. Type @ and a name to "
  "mention someone, for example: @Sam can you check the venue capacity before this "
  "goes back to Maya?")

h1("8.  Scheduling and publishing")
p("Once approved, the post panel offers <b>Schedule</b> (moves it to <i>Scheduled</i>, "
  "locked in and ready) and <b>Publish now</b>.")
p("Your content moves through six stages, and every post sits at exactly one:")
table([
    ["Idea", "Draft", "Needs approval", "Approved", "Scheduled", "Published"],
], [(PAGE_W - 2 * MARGIN) / 6] * 6, header=True)
p("Each stage has its own colour on the calendar, so a glance tells you what is blocked "
  "and on whom.")
warn("Important - about publishing today.",
     "'Publish now' marks the post as published inside Cadence, but does <b>not yet "
     "post to Instagram, TikTok or the other platforms</b>. Live posting is coming. For "
     "now, treat Scheduled and Published as your record of what is approved and when it "
     "should go out, and post through your usual tool. Everything else - planning, "
     "approvals, comments - is fully live.")

h1("9.  Working across all your clients")
p("This is what Cadence is built for. At the top of the sidebar is the "
  "<b>All clients / Single client</b> toggle.")
bullets([
    "<b>All clients</b> - every brand on one calendar, colour-coded. "
    "'What is going out this week, across everything?'",
    "<b>Single client</b> - one brand only. 'Let me focus on Willow &amp; Fig.'",
])
h2("Filtering")
p("In the sidebar, click a <b>client</b> name to show or hide it, a <b>channel</b> icon "
  "to filter by platform, or a <b>status</b> to filter by stage. Dimmed means hidden.")
note("The single most useful habit:",
     "stay in All clients, then click <b>Needs approval</b> in the status list. You now "
     "see every post across every client that is waiting on someone. That is your Monday "
     "morning chase list.")
p("Each client shows a post count, so an account that has gone quiet is obvious.")

h1("10.  Choosing your view")
p("Switch with the buttons in the top bar, or press 1 to 5.")
table([
    ["View", "Key", "Best for"],
    ["Month", "1", "The big picture - how a month is shaping up"],
    ["Week", "2", "Posting times; seeing gaps in a specific week"],
    ["List", "3", "Working through lots of posts; bulk changes"],
    ["Board", "4", "Workflow - what is stuck at which stage"],
    ["Feed", "5", "Checking how a client's grid will actually look"],
], [28 * mm, 15 * mm, 127 * mm])
h2("Feed view deserves a mention")
p("Pick a client and a channel, and Cadence renders their upcoming posts as the platform "
  "would: Instagram and TikTok as a three-column grid, YouTube and Facebook as video "
  "cards, X and LinkedIn as a text feed. Catch an ugly run of four dark photos in a row "
  "before it is live.")
h2("Rescheduling - just drag")
bullets([
    "<b>Month:</b> drag a post to another day (time of day is kept)",
    "<b>Week:</b> drag to any day and hour",
    "<b>Board:</b> drag between stages to move work forward",
])
p("The <b>density</b> toggle switches between compact and comfortable, and there is a "
  "light/dark toggle. Cadence remembers both, plus your last view and filters.")

h1("11.  Recurring slots")
p("Most clients have a rhythm - 'Tip Tuesday every week at 9am'. Set it once. Go to "
  "<b>manage</b>, find the client, then <b>+ add slot</b>.")
table([
    ["Field", "Example"],
    ["Label", "Plant care tip"],
    ["Day", "Tuesday"],
    ["Time", "09:00"],
    ["Channel", "Instagram"],
], [40 * mm, 130 * mm])
p("Now click <b>Fill next 2 weeks</b>. Cadence creates draft posts on every matching "
  "slot, so your recurring commitments are already on the calendar waiting for copy - "
  "you are never staring at an empty week.")
note("Safe to click as often as you like.",
     "It skips slots that already have a post, so you will not get duplicates.")

h1("12.  Never run out of ideas")
p("Blank calendar for a client? Click <b>Ideas</b> in the top bar.")
bullets([
    "Pick the client. Suggestions are shaped by their industry and their channels.",
    "Click <b>Generate ideas</b> - you get six.",
    "Each shows a topic, a hook explaining why the angle works, plus a suggested "
    "content type and channels.",
    "Click <b>Draft</b> on any you like - it drops onto the calendar as a draft.",
    "Click <b>Generate ideas</b> again for a fresh set. Keep pulling until something lands.",
])
example("Example suggestion for Willow &amp; Fig",
        "<b>The plant shop mistake almost everyone makes</b><br/>"
        "Lead with the mistake, save the fix for slide 3 - earns the swipe.<br/>"
        "carousel - Instagram, Facebook")
p("Nothing is added until you click <b>Draft</b>, so browse freely.")

h1("13.  Changing lots of posts at once")
p("Switch to <b>List</b> view (key 3). Tick the posts you want, or use the select-all "
  "box in the header. A bar appears at the bottom:")
bullets([
    "<b>Set status</b> - move them all to a stage at once",
    "<b>+1 day / +1 week / -1 day</b> - shift schedules",
    "<b>Delete</b>",
    "<b>Clear</b> - deselect",
])
note("Worked example.",
     "Willow &amp; Fig push their workshop back a week. Switch to List, tick the five "
     "related posts, click +1 week. Five reschedules in about ten seconds.")

h1("14.  Keyboard shortcuts")
p("Press <b>?</b> any time to see these in the app. Shortcuts are ignored while you are "
  "typing, so they never interrupt writing copy.")
table([
    ["Key", "Does", "Key", "Does"],
    ["N", "New post", "D", "Toggle density"],
    ["T", "Jump to today", "Esc", "Close any panel"],
    ["1 to 5", "Month / Week / List / Board / Feed", "?", "Show shortcuts"],
    ["Left / Right", "Previous or next month", "", ""],
], [26 * mm, 62 * mm, 22 * mm, 60 * mm])

h1("15.  A typical week in Cadence")
table([
    ["Day", "What you do"],
    ["Monday", "<b>See everything.</b> Open on All clients / Month. Filter to Needs "
               "approval to spot anything a client has not answered, and nudge them."],
    ["Tuesday", "<b>Fill the gaps.</b> Any client looking thin? Hit Ideas and drop two "
                "or three drafts onto their calendar. Use Fill next 2 weeks for "
                "recurring slots."],
    ["Wednesday", "<b>Write.</b> Work through drafts. Write per-channel variants and "
                  "watch the character counters."],
    ["Thursday", "<b>Send for approval.</b> Request approval on everything ready, then "
                 "send each client their link."],
    ["Friday", "<b>Schedule and sanity-check.</b> As approvals land, move posts to "
               "Scheduled on the Board. Flick through Feed view for each client to "
               "check the grid looks right."],
], [26 * mm, 144 * mm])

h1("16.  Questions and answers")
qa = [
    ("Do my clients need an account?",
     "No. They get a link that works on any device - no login, no install, nothing to learn."),
    ("Can a client see my other clients?",
     "No. Their link only ever shows their own brand, and only posts you have sent for "
     "review. Your drafts, ideas and internal comments stay private."),
    ("Can I send the same link every time?",
     "Yes - it does not expire. Ask them to bookmark it. New posts you send for review "
     "appear there automatically."),
    ("What if a client forwards their link?",
     "Anyone with the link can view and approve that client's content. The link is "
     "impossible to guess, but it is shareable - the same as a Figma or Loom share "
     "link. Only send it to people you are happy approving content."),
    ("Does Cadence post to Instagram for me?",
     "Not yet. Planning, approvals, scheduling and comments are fully live; automatic "
     "posting to the platforms is coming. Publish through your usual tool for now."),
    ("Will my clients get an email when something needs review?",
     "Not yet - send them the link when you have something waiting. Automatic reminders "
     "are on the roadmap."),
    ("I forgot my password.",
     "Whoever set up your Cadence can change it. Note that changing it signs everyone out."),
    ("Can two people use it at once?",
     "Yes, but everyone shares one workspace password, so there is no record of who did "
     "what. Per-person accounts are on the roadmap."),
    ("Something looks wrong, or a post will not save.",
     "Check your internet connection first - Cadence will tell you if it cannot reach "
     "the server. Refresh the page; nothing saved is lost."),
]
for q, a in qa:
    story.append(KeepTogether([
        Paragraph(q, style("qq", fontName="Helvetica-Bold", fontSize=10, leading=13,
                           textColor=INK, spaceBefore=7, spaceAfter=2)),
        Paragraph(a, S_BODY),
    ]))

story.append(Spacer(1, 10))
story.append(rule(ACCENT, 1.5, 8))
p("Cadence is built around one idea: <b>your whole roster on one board, and a clean way "
  "for clients to say yes.</b> If something in this guide did not match what you saw, or "
  "you have hit a wall, get in touch - we would rather hear about it than have you work "
  "around it.")

# ---------------------------------------------------------------- build -----

doc = BaseDocTemplate(
    OUT, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=22 * mm,
    title="Cadence - Getting Started",
    author="Cadence",
    subject="Step-by-step guide for social media managers and agencies",
)
frame = Frame(MARGIN, 22 * mm, PAGE_W - 2 * MARGIN, PAGE_H - MARGIN - 22 * mm, id="body")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=decorate)])
doc.build(story)

print(f"wrote {OUT}")
