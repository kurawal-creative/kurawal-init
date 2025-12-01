import { prisma } from "@/lib/prisma";

async function main() {
    // Hash passwords using Bun.password.hash
    const hashedPassword1 = await Bun.password.hash("password123");

    // Create user
    await prisma.user.create({
        data: {
            username: "admin",
            email: "admin@example.com",
            name: "Administrator",
            password: hashedPassword1,
        },
    });

    console.log("Seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
