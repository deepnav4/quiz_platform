import { seedComputerNetworksForProfessor } from "./lib/seedComputerNetworksQuiz.js";
import { prisma } from "@repo/db";

seedComputerNetworksForProfessor()
  .then(({ quiz, session }) => {
    console.log("\nDone.");
    console.log(`  Quiz ID:     ${quiz.id}`);
    if (session) console.log(`  Session ID:  ${session.id}`);
    console.log(`  Join code:   ${session?.joinCode ?? "—"}`);
    console.log(`  Login:       professor@university.edu / password123`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
