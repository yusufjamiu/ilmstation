/** Default text for the legal pages. Admins can edit them in Admin → Legal pages. */
export type LegalKey = "privacy" | "terms" | "prizes";
export const LEGAL_TITLES: Record<LegalKey, string> = { privacy: "Privacy Policy", terms: "Terms of Use", prizes: "Prize Rules" };

export const DEFAULT_LEGAL: Record<LegalKey, string> = {
privacy: `IlmStation Limited ("IlmStation", "we", "us") runs the website ilmstation.com and the IlmStation app. This policy explains what personal data we collect, why, and the choices you have. We follow the Nigeria Data Protection Act 2023.

## What we collect
- Account details: your name, email address (or username for children's accounts), gender, age group and zone (Kids, Teens or Adults). Passwords are handled by our login provider and are never visible to us.
- Learning activity: XP, levels, streaks, quiz results, books and lessons you open or finish, Hifz and Study progress, and items you unlock.
- Things you post: chatroom messages, book discussion posts, ratings and reports.
- IlmWorld: your character, progress, virtual money and in-game activity.
- Payments: when you buy Premium, Paystack processes your card or bank details. We never see or store them. We keep the payment reference, amount, plan and date.
- Prizes: if you win, the details needed to send your prize (bank account, or phone number and network, or delivery address). Bank details are erased once the prize is paid.
- Technical data: your approximate country (to show prices in the right currency), your location for prayer times if you allow it, and basic device and usage information.

## Why we use it
- To run your account and the learning features, and to remember your progress.
- To show the right prices and process payments and prizes.
- To keep IlmStation safe: moderating chatrooms, handling reports and preventing abuse.
- To send service emails: welcome, receipts, reminders before a trial or Premium ends, and the weekly report for parents.
- To meet our legal, tax and accounting duties.

We rely on our agreement with you, your consent (for example location, or a parent's consent for a child), our legitimate interest in keeping the service safe and improving it, and our legal obligations.

## Children
- Children under 13 can only use IlmStation through an account created by a parent or guardian in the Family hub. The parent gives consent for the child's data to be used as described here.
- Children's accounts use a username, not an email. They cannot use chatrooms, private messages, duels or other open social features.
- Parents can see their child's progress, reset the password and delete the child's account at any time.
- We do not knowingly collect data from children under 13 without a parent's consent. If you think this has happened, contact us and we will delete it.

## Who we share it with
We never sell your data. We share it only with service providers that help us run IlmStation, under their own data protection terms:
- Google Firebase (accounts, database and file storage)
- Vercel (website hosting)
- Paystack (payments)
- Resend (emails)
- Services that provide prayer times and Qur'an audio (they receive your city or approximate location if you use those features)
- An AI provider, if you use IlmBot (your questions are sent to it to generate answers)

We may also share data if the law requires it. Some providers store data outside Nigeria; where they do, we rely on appropriate safeguards.

## How long we keep it
We keep your data while your account is active. When you delete your account, we delete your personal data, except payment and prize records, which we keep for as long as tax and accounting laws require.

## Your rights
- See the data we hold about you, or ask us to correct it.
- Delete your account at any time in Settings → Delete my account (parents delete children's accounts in the Family hub).
- Object to some uses, or withdraw your consent.
- Complain to the Nigeria Data Protection Commission (NDPC).

To use any of these rights, email us.

## Storage on your device
We use your browser's storage to keep you logged in and remember preferences such as theme, time format and adhan settings. We do not use advertising trackers.

## Security
We use secure, well-known providers, encrypted connections, and access controls that limit who can see your data.

## Changes
We may update this policy. If the change is important, we will tell you in the app or by email.

## Contact
IlmStation Limited · Nigeria
Email: admin@ilmstation.com`,

terms: `These terms are an agreement between you and IlmStation Limited ("IlmStation", "we", "us") for using ilmstation.com and the IlmStation app. By creating an account or using IlmStation, you agree to them.

## Who can use IlmStation
- You must be 13 or older to create your own account.
- Children under 13 may use IlmStation only through an account created by a parent or guardian in the Family hub. The parent is responsible for the child's use.
- One person per account. Keep your password private. You are responsible for activity on your account.

## Learning content
IlmStation is for Islamic learning and reflection. It is not a fatwa service. For personal religious rulings, please consult a qualified scholar. IlmBot is an AI assistant and can make mistakes, so check its sources.

## Premium
- Premium unlocks extra books, audio, lessons, games and higher daily limits, as shown in the app.
- Prices are shown before you pay, in naira (or US dollars outside Nigeria where offered), and are paid in advance through Paystack.
- A monthly plan gives 30 days of Premium; a yearly plan gives 365 days. Plans do not renew automatically. You choose to renew.
- The free trial is available once per person.
- Promotions and discounts run for the dates shown and may end at any time.
- Family plans: the person who pays manages the members. Members have Premium while the plan is active.
- When Premium ends, Premium content locks again. Your progress is kept, and items you unlocked with points stay unlocked.

## Refunds
Payments are not refundable once Premium has started, except for duplicate or failed charges. If you were charged twice or charged without receiving Premium, email us within 14 days and we will put it right.

## XP, points and virtual money
XP, points and IlmWorld money have no cash value. They cannot be sold, transferred outside the app or exchanged for money. We may correct balances gained through errors or abuse.

## Community rules
In chatrooms, discussions and IlmWorld, please:
- Be respectful and keep to good Islamic manners.
- Do not share links, personal contact details or private information.
- Do not harass, bully, spread hate, or post anything harmful, sexual or misleading.
- Do not pretend to be someone else.

Moderators may remove content, and we may suspend or delete accounts that break these rules.

## Our content
IlmStation's design, text, games and features belong to IlmStation Limited or our partners. You may use them for personal learning. Do not copy, resell or redistribute them without permission. Cards you make are for your personal sharing.

## What you post
You keep ownership of what you post. You allow us to display it within IlmStation so the features work. You are responsible for what you post.

## Ending your account
You can delete your account at any time in Settings. We may suspend or end accounts that break these terms or misuse the service.

## Limits of our responsibility
We work hard to keep IlmStation accurate and available, but it is provided "as is". Prayer times are calculated estimates; follow your local masjid where they differ. To the extent the law allows, our total responsibility to you is limited to the amount you paid us in the 12 months before the claim.

## Changes and law
We may update these terms. If the change is important, we will tell you in the app or by email. These terms are governed by the laws of the Federal Republic of Nigeria.

## Contact
IlmStation Limited · Nigeria
Email: admin@ilmstation.com`,

prizes: `These rules apply to the Ramadan daily prize quiz and any other prize quiz announced on IlmStation.

## Who can enter
- Registered users in the Teens and Adults zones, unless a quiz says otherwise.
- One account per person. Entering with more than one account leads to disqualification.
- IlmStation staff and admins cannot win prizes.

## How it works
- Each quiz opens and closes at the times shown in the app.
- You can enter each quiz once. Your answers are final when you submit.
- Results are shown at the announced results time.

## Winners
- Winners are the top scorers for that quiz, as announced.
- Ties are decided by the fastest completion time, then by a random draw if still tied.
- Winners may be shown on the leaderboard by first name and level.

## Prizes
- Prizes are announced for each quiz. They may be cash, airtime or recharge cards, data bundles, books or gifts.
- Prizes cannot be exchanged for cash or another prize, unless we say so.
- Some prizes are provided by sponsors.

## Claiming your prize
- Send your details in the app within 7 days of the results:
- Cash: a Nigerian bank account in your own name.
- Airtime or data: your phone number and network.
- Gifts or books: a delivery address.
- We check the details and send your prize within 7 days of receiving them.
- Prizes not claimed within 14 days of the results may be forfeited.

## Fair play
Using bots, sharing answers, multiple accounts or any other cheating leads to disqualification. Our decision on results and prizes is final.

## Changes
We may change, pause or cancel a quiz or its prizes if something goes wrong, and will tell entrants in the app.

## Contact
IlmStation Limited · Nigeria
Email: admin@ilmstation.com`,
};
