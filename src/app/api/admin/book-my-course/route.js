import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

// Check if user is admin
async function isAdmin() {
  try {
    const admin = await requireAdmin();
    return admin.ok;
  } catch (err) {
    console.error("[BookMyCourse API] isAdmin check failed:", err);
    return false;
  }
}

export async function GET(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // packages, orders, or banner

  console.log(`[BookMyCourse Admin API] GET request for type: ${type}`);

  try {
    if (type === "packages") {
      const packages = await prisma.coursePackage.findMany({
        orderBy: [{ board: "asc" }, { class: "asc" }],
      });
      return NextResponse.json(packages);
    } else if (type === "orders") {
      const orders = await prisma.courseOrder.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    } else if (type === "promos") {
      const promos = await prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(promos);
    } else if (type === "settings") {
       const settings = await prisma.setting.findMany({
         where: { key: { in: ["bookMyCourseHero", "globalDeliveryFee"] } }
       });
       return NextResponse.json(settings);
    } else if (type === "banner") {
      const banner = await prisma.setting.findUnique({
        where: { key: "bookMyCourseHero" },
      });
      let value = banner?.value || "[]";
      if (value && !value.startsWith("[")) {
          value = JSON.stringify([value]);
      }
      return NextResponse.json({ value });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[BookMyCourse Admin API] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const type = body.type;

  try {
    if (type === "package") {
      const { id, board, class: classNum, name, price, bookCount, images, description } = body.data;
      const pkg = await prisma.coursePackage.upsert({
        where: { board_class: { board, class: parseInt(classNum, 10) } },
        update: { name, price: parseFloat(price), bookCount: parseInt(bookCount, 10), images, description },
        create: { board, class: parseInt(classNum, 10), name, price: parseFloat(price), bookCount: parseInt(bookCount, 10), images, description },
      });
      return NextResponse.json(pkg);
    } else if (type === "banner_update") {
      const { value } = body.data;
      const banner = await prisma.setting.upsert({
        where: { key: "bookMyCourseHero" },
        update: { value },
        create: { key: "bookMyCourseHero", value },
      });
      return NextResponse.json(banner);
    } else if (type === "update_settings") {
       const { key, value } = body.data;
       const setting = await prisma.setting.upsert({
         where: { key },
         update: { value: String(value) },
         create: { key, value: String(value) },
       });
       return NextResponse.json(setting);
    } else if (type === "promo") {
      const { id, code, discountType, discountValue, status, expiryDate } = body.data;
      if (id) {
         const updated = await prisma.promoCode.update({
           where: { id },
           data: { code, discountType, discountValue: parseFloat(discountValue), status, expiryDate: expiryDate ? new Date(expiryDate) : null }
         });
         return NextResponse.json(updated);
      } else {
         const created = await prisma.promoCode.create({
           data: { code, discountType, discountValue: parseFloat(discountValue), status, expiryDate: expiryDate ? new Date(expiryDate) : null }
         });
         return NextResponse.json(created);
      }
    } else if (type === "order_status_update") {
      const { id, status } = body.data;
      const order = await prisma.courseOrder.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[BookMyCourse Admin API] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    if (type === "promo") {
      await prisma.promoCode.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    if (type === "package") {
       await prisma.coursePackage.delete({ where: { id } });
       return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
