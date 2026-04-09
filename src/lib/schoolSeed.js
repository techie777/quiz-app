import { prisma } from "@/lib/prisma";

export async function ensureSchoolSeed() {
  const count = await prisma.schoolBoard.count();
  if (count > 0) return;

  const board = await prisma.schoolBoard.create({
    data: {
      name: "CBSE",
      slug: "cbse",
      sortOrder: 0,
      hidden: false,
      classes: {
        create: [
          {
            number: 1,
            subjects: {
              create: [
                {
                  name: "Hindi",
                  slug: "hindi",
                  sortOrder: 0,
                  chapters: {
                    create: Array.from({ length: 8 }).map((_, idx) => {
                      const chapterNum = idx + 1;
                      const chapterTitle = `Chapter ${chapterNum}`;
                      const mcq = {
                        type: "mcq",
                        prompt: `(${chapterTitle}) एक विकल्प चुनें: "क" कौन सा विकल्प है?`,
                        options: JSON.stringify(["क", "ख", "ग", "घ"]),
                        answer: "क",
                      };
                      const tf = {
                        type: "true_false",
                        prompt: `(${chapterTitle}) सत्य/असत्य: "यह एक डमी प्रश्न है।"`,
                        options: JSON.stringify(["True", "False"]),
                        answer: "True",
                      };
                      const fib = {
                        type: "fill_blank",
                        prompt: `(${chapterTitle}) रिक्त स्थान भरें: भारत की राजधानी ____ है।`,
                        options: "[]",
                        answer: "नई दिल्ली",
                      };
                      const match = {
                        type: "match_column",
                        prompt: `(${chapterTitle}) मिलान करें: सही जोड़ी बनाएं।`,
                        options: JSON.stringify({
                          left: [
                            { id: "l1", text: "भारत" },
                            { id: "l2", text: "फ्रांस" },
                          ],
                          right: [
                            { id: "r1", text: "नई दिल्ली" },
                            { id: "r2", text: "पेरिस" },
                          ],
                          pairs: [
                            { leftId: "l1", rightId: "r1" },
                            { leftId: "l2", rightId: "r2" },
                          ],
                        }),
                        answer: "[]",
                      };
                      return {
                        title: chapterTitle,
                        sortOrder: idx,
                        questions: {
                          create: [mcq, tf, fib, match],
                        },
                      };
                    }),
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
}
