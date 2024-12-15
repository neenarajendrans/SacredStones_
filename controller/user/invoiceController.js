const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");
const Order = require("../../model/orderModel");

class InvoiceGenerator {
  constructor(order, stream) {
    this.order = order;
    this.doc = new PDFDocument({ margin: 50, size: "A4" });
    this.doc.pipe(stream);
  }

  async generateHeader() {
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "logo.png");

      // Check if file exists
      if (fs.existsSync(logoPath)) {
        // Adjust logo size and position
        this.doc.image(logoPath, 50, 30, { width: 230, height: 60 });
      } else {
        console.warn("Logo file not found:", logoPath);
      }

      // Company details with improved formatting
      this.doc
        .fillColor("#333333")
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("SacredStones", 400, 40)
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#666666")
        .text("Kayamkulam, Alappuzha", 400, 65)
        .text("Contact: 9061268766", 400, 80)
        .text("sacredstonesnrs@gmail.com", 400, 95);
    } catch (error) {
      console.error("Error loading logo:", error);
    }
  }
  async generateCustomerInformation() {
    const specificAddress = this.order.address;

    if (!specificAddress) {
      throw new Error("Selected address not found");
    }

    const customerTableData = {
      headers: ["INVOICE DETAILS", "SHIPPING ADDRESS"],
      rows: [
        [
          `Invoice Number: ${this.order.orderId}\n` +
            `Date: ${formatDate(this.order.orderDate)}\n` +
            `Status: ${this.order.orderStatus}\n` +
            `Payment Method: ${this.order.paymentMethod}`,

          `${specificAddress.fullName}\n` +
            `${specificAddress.address}, ${specificAddress.locality}\n` +
            `${specificAddress.city}, ${specificAddress.state} - ${specificAddress.pincode}\n` +
            `Phone: ${specificAddress.phoneNumber}`,
        ],
      ],
    };

    await this.doc.table(customerTableData, {
      prepareHeader: () =>
        this.doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333"),
      prepareRow: () =>
        this.doc.font("Helvetica").fontSize(10).fillColor("#666666"),
      width: 500,
      x: 50,
      divider: {
        header: { disabled: false, width: 2, opacity: 1 },
        horizontal: { disabled: false, width: 1, opacity: 0.5 },
      },
    });

    this.doc.moveDown();
  }

  async generateInvoiceTable() {
    const tableData = {
      headers: ["Item", "Unit Price", "Quantity", "Total Price"],
      rows: this.order.items.map((item) => [
        item.name,
        formatCurrency(item.price),
        item.qty.toString(),
        formatCurrency(item.price * item.qty),
      ]),
    };

    // Main items table
    await this.doc.table(tableData, {
      prepareHeader: () =>
        this.doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333"),
      prepareRow: () =>
        this.doc.font("Helvetica").fontSize(10).fillColor("#666666"),
      width: 500,
      x: 50,
      divider: {
        header: { disabled: false, width: 2, opacity: 1 },
        horizontal: { disabled: false, width: 1, opacity: 0.5 },
      },
    });

    this.doc.moveDown();

    // Summary table
    const discount = this.order.discount;
    const summaryRows = [
      ["", "", "", "Subtotal:", formatCurrency(this.order.totalAmount)],
    ];

    if (discount > 0) {
      summaryRows.push([
        "",
        "",
        "",
        "Discount:",
        `- ${formatCurrency(discount)}`,
      ]);
    }

    summaryRows.push([
      "",
      "",
      "",
      "Final Amount:",
      formatCurrency(this.order.finalAmount),
    ]);

    const summaryTable = {
      headers: ["", "", "", "", ""],
      rows: summaryRows,
    };

    await this.doc.table(summaryTable, {
      prepareHeader: () => this.doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: () =>
        this.doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333"),
      width: 500,
      x: 50,
      divider: {
        header: { disabled: true },
        horizontal: { disabled: true },
      },
    });
  }

  async generate() {
    await this.generateHeader();
    await this.generateCustomerInformation();
    await this.generateInvoiceTable();
    this.doc.end();
  }
}

function formatCurrency(cents) {
  return "$" + cents.toFixed(2);
}

function formatDate(date) {
  return date.toLocaleDateString();
}

module.exports = InvoiceGenerator;

const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id })
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`
    );

    // Create and generate the invoice
    const invoice = new InvoiceGenerator(order, res);
    await invoice.generate();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
};

module.exports = { downloadInvoice };
