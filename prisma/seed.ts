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
            avatar: "https://i.ibb.co.com/20GWtzm0/028c7f187f32db8a7007b08adf304cf0-1.jpg",
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
