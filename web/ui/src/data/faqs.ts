/**
 * The questions clients ask first, answered plainly. Each page shows its own
 * set and emits it as FAQPage structured data through `faqSchema`.
 *
 * Every answer is general guidance and says so where it matters; nothing here
 * quotes a figure the portfolio or the law does not support.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const buyingFaq: FaqItem[] = [
  {
    question: "Can a foreigner buy property in Phuket?",
    answer:
      "Yes. A foreign buyer can own a condominium unit outright with a freehold title, within the foreign quota of 49% of a building's saleable area. Land cannot be held in a foreign name, so a villa is usually bought with freehold title to the building and a registered 30-year lease on the land, with renewal options in the contract. We explain the structure for each listing before you reserve.",
  },
  {
    question: "What is the difference between freehold and leasehold here?",
    answer:
      "Freehold means the title is registered in your own name at the Land Office with no time limit; it is available for condominium units within the foreign quota and for the building of a villa. Leasehold is a registered right to occupy land for up to 30 years, recorded on the back of the title deed so it binds any future landowner. Renewal terms are contractual, which is why the quality of the landowner and of the drafting matters.",
  },
  {
    question: "What does due diligence cover?",
    answer:
      "The title document itself (a full Chanote title is what a serious purchase should sit on), registered road access, building permits, any encumbrances on the land, and for a condominium the health of the juristic person and its sinking fund. We walk you through each item and recommend an independent Thai lawyer to review the contract before a deposit is paid.",
  },
  {
    question: "What are the costs on transfer?",
    answer:
      "Transfer fees, specific business tax or stamp duty, withholding tax and, for a lease, the lease registration fee are payable at the Land Office on the day of transfer. Which party pays which is a matter for the contract, so we have the split agreed in writing before you sign. Ongoing costs are modest: a monthly common area fee per square metre for a condominium, or an estate maintenance charge for a villa.",
  },
  {
    question: "Can I buy off plan, and how are payments staged?",
    answer:
      "Yes. Projects under construction are sold on a staged schedule tied to construction milestones, with a reservation fee, a contract deposit and instalments through to completion. We only represent projects whose developers we have worked with, and we check the construction licence, the land title and the escrow or payment terms before listing them.",
  },
  {
    question: "Do you help with viewing from abroad?",
    answer:
      "Most of our clients see a house for the first time on a video call. We walk the property live, send full photography and floor plans, and arrange an in-person visit when you are on the island. The first conversation is confidential and carries no obligation.",
  },
];

export const homeFaq: FaqItem[] = [
  {
    question: "What does Latitude 8 Estate do?",
    answer:
      "We represent architecturally significant villas, estates and condominiums in Phuket and Koh Samui, advise buyers and sellers through the purchase, and manage houses for owners who live abroad. The roster is deliberately small, so each client works with one principal from first conversation to completion.",
  },
  {
    question: "Where are the properties?",
    answer:
      "On the west, north and east coasts of Phuket, from the headlands above Bang Tao and the protected shoreline at Nai Thon to the calm bays of the east coast, and on the quiet south coast of Koh Samui. Each listing names its district and distances to the beach, the airport, schools and marinas.",
  },
  {
    question: "Can a foreign buyer own property in Thailand?",
    answer:
      "Yes. Condominium units can be owned freehold within the foreign quota; villas are held with freehold title to the building and a registered long-term lease on the land. The buying guide on the Projects page sets out the structures, the due diligence and the costs.",
  },
  {
    question: "Do you manage properties as well as sell them?",
    answer:
      "Yes. Property management is a separate service for owners who are away for part of the year: maintenance of the house and its systems, pools and gardens, household staff, monthly reporting and emergency response. Details are on the Property Management page.",
  },
];

export const managementFaq: FaqItem[] = [
  {
    question: "Who is property management for?",
    answer:
      "Owners who are not on the island all year. A closed tropical house grows mould within weeks, a pool turns in days and a blocked drain can flood a ground floor in one monsoon afternoon. Management keeps a person in the house on a schedule, runs its systems, and reports to you monthly with photographs.",
  },
  {
    question: "What is included?",
    answer:
      "A documented inventory of every system and finish with its warranties, a preventative maintenance calendar, pool and garden care, household staff administration, vendor management, monthly reporting, and an emergency procedure that says who may authorise what without waking you at night. The scope is agreed in writing after an on-site audit.",
  },
  {
    question: "Can you manage household staff?",
    answer:
      "Yes. Contracts, social security, holidays and the household budget are handled in Thai and in writing, which is the part most owners find hardest to do from abroad.",
  },
  {
    question: "Can the house be let while I am away?",
    answer:
      "It can, and the running costs can be covered that way, but letting brings licensing, tax, guest management and wear that a private house never sees. It should be a decision rather than a drift, and the management arrangement is designed for it from the start if you choose to.",
  },
  {
    question: "How is the fee structured?",
    answer:
      "A monthly fee for the agreed scope, with maintenance and repairs invoiced at cost against a pre-agreed authority limit. We set it out in a written proposal after the audit, and we are happy to say what we think a house does not need.",
  },
];

export const aboutFaq: FaqItem[] = [
  {
    question: "What kind of property do you represent?",
    answer:
      "Villas, private estates and low-rise condominiums in Phuket and Koh Samui that are well designed and well built for this climate. We decline more instructions than we accept, which is what lets us know each listing in detail: its structure, its title, its running costs and the honest case against it.",
  },
  {
    question: "Do you work with buyers, sellers or both?",
    answer:
      "Both. For a buyer we run a search, assess the houses that fit, and manage the purchase through to the Land Office. For a seller we prepare the house and its paperwork, present it to a small number of qualified buyers, and handle the negotiation and transfer. Where we act for both sides of one transaction, we say so.",
  },
  {
    question: "Is the first conversation an obligation?",
    answer:
      "No. Tell us what you are looking for, or what you are thinking of selling, and we will say plainly whether we can help. Every enquiry is handled in confidence by a principal.",
  },
];
