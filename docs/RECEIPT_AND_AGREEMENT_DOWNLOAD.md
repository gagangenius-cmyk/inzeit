# How to Download Receipts and Agreements

## Payment Receipts

### Where to go
**Finance → Invoices & Payments** (`/admin/invoices-payments`)

### Steps

1. Log in and click **Finance** in the left sidebar, then click **Invoices & Payments**.
2. Click the **Payments** tab at the top of the page.
3. Use the search box or date filters to find the client's payment.
4. In the Actions column, click the green **printer icon** (🖨) next to the payment row.
5. A new browser tab opens with a formatted receipt showing:
   - Receipt number
   - Client name, email, phone
   - Service / opportunity name
   - Amount paid, currency, payment method
   - Transaction ID (if any)
   - Branch details and consultant name
6. Your browser's Print dialog opens automatically.
   - **To download as PDF:** In the Print dialog, change **Destination / Printer** to **"Save as PDF"** (Chrome / Edge) or **"Microsoft Print to PDF"** (Windows), then click **Save**.
   - **To print on paper:** Select your printer and click **Print**.

> You can also click the **eye icon** to view full payment details, then click the **Print Receipt** button at the bottom of that modal.

---

## Client Service Agreements

### Where to go
**Admin → Agreement Generator** (`/admin/agreements`)

### Steps

1. Click **Agreements** in the left sidebar (under the Configuration / Settings section).
2. The Agreement Generator form opens.
3. Fill in all the client fields:
   | Field | Example |
   |---|---|
   | Agreement No. | AGR-2024-001 |
   | Date | 2024-07-01 |
   | Service Program | Express Entry |
   | Destination Country | Canada |
   | Client Full Name | John Smith |
   | Nationality | Indian |
   | Passport No. | A1234567 |
   | Emirates ID No. | 784-1990-1234567-1 |
   | Phone | +971 50 123 4567 |
   | Email | john@example.com |
   | Occupation | Engineer |
   | Total Retainer Fee (AED) | 15,000 |
   | Initial Payment (AED) | 7,500 |
   | Second Payment (AED) | 7,500 |
   | Second Payment Due | 2025-01-01 |
4. Fill in the **Annexure A** section at the bottom (service-specific details).
5. Click **Preview Agreement** to see the bilingual (English / Arabic) formatted document.
6. In Preview mode:
   - Click **Download PDF** → the browser generates a PDF using the page content and saves it automatically as `DMC_Agreement_ClientName_AgreementNo.pdf`.
   - Click **Print** → opens the browser Print dialog; select **"Save as PDF"** to download or select a printer to print on paper.
7. Click **Edit** to go back and make changes.

---

## Receipts from within the Opportunity Flow

Counsellors can also access receipts directly from a lead's opportunity flow:

1. Go to **Leads** and open a lead.
2. Click **Open Opportunity Flow** (the blue button).
3. Navigate to the **Accounts** stage.
4. All payments for that opportunity are listed. Click the payment to see its details including proof of payment image.

For the printable receipt go to Finance → Invoices & Payments as described above and search for the client name or payment number.

---

## Tips

| Action | How |
|---|---|
| Find a payment quickly | Use the search box — search by client name, email, payment number, or transaction ID |
| Download multiple receipts at once | Use the date range filter to narrow results, print each one individually |
| Branded PDF with company header | The receipt includes DM Immigration Consultants licence details and branch info automatically |
| Agreement filename | Saved as `DMC_Agreement_<ClientName>_<AgreementNo>.pdf` |
| Re-printing an old receipt | Go to Payments tab, filter by date or search by client name, print icon |

---

## Browser Compatibility

| Browser | PDF Download method |
|---|---|
| Google Chrome | Print dialog → Destination: "Save as PDF" |
| Microsoft Edge | Print dialog → Printer: "Save as PDF" |
| Firefox | Print dialog → PDF option in printer list |
| Safari (Mac) | Print dialog → PDF button (bottom-left) → "Save as PDF" |
