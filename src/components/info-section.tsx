"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function InfoSection() {
  const faqs = [
    {
      question: "Is the generated data secure?",
      answer: "Absolutely. All data is generated on-demand in your browser and is never stored on our servers. The data is completely synthetic and does not contain any real-world personal information, ensuring total privacy and security.",
    },
    {
      question: "What's the maximum number of rows I can generate?",
      answer: "Our tool is optimized for performance and can generate up to 10,000 rows of data in a single request, making it suitable for both small-scale and large-scale testing needs.",
    },
    {
      question: "Can I generate data for specific scenarios?",
      answer: "Absolutely. By combining different field types, you can create data for a wide range of scenarios, from user registration forms to complex e-commerce order systems. Our AI tries to generate logically consistent data based on the field names you provide, making your test data highly realistic for your specific use case.",
    },
    {
      question: "Which export formats are supported?",
      answer: "You can download your generated data in a wide variety of formats, including JSON, CSV, TSV, XML, SQL (INSERT statements), YAML, and Microsoft Excel (.xlsx).",
    },
    {
      question: "What types of data can I generate with a random test generator online?",
      answer: "Our tool supports a comprehensive range of data types across various categories, including personal information (names, ages), contact details (emails, phone numbers), geographical data (addresses, countries), business information (company names, job titles), financial data (credit card numbers), and technical identifiers (UUIDs, GUIDs). You can explore all available options in the 'Type' dropdown menu.",
    },
    {
      question: "How can I integrate this data into my testing or development process?",
      answer: "Integrating the data is straightforward. First, define the data structure you need using our interface. Next, generate the required number of records and preview them. Finally, download the data in your preferred format (e.g., JSON, CSV, SQL). This file can then be used to populate your databases, mock API responses, or feed directly into your automated test scripts.",
    }
  ];

  return (
    <div className="bg-background text-foreground py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4 md:px-6 space-y-16">
        
        <section id="what-it-is" className="space-y-4">
          <h2 className="text-3xl font-headline font-semibold text-foreground text-center">What is a Test Data Generator?</h2>
          <div className="text-lg text-muted-foreground space-y-4 max-w-3xl mx-auto">
            <p>
              A Test Data Generator is an essential tool for software development and quality assurance. It automates the creation of large volumes of realistic, synthetic data used for testing applications. Instead of manually creating data or using sensitive production data, developers and testers can generate specific, structured, and contextually-aware data on-demand.
            </p>
            <p>
              This allows for more thorough testing, covering everything from simple form validations to complex database load testing, all while protecting user privacy and speeding up the development lifecycle.
            </p>
          </div>
        </section>

        <section id="how-to-use" className="space-y-6">
          <h2 className="text-3xl font-headline font-semibold text-foreground text-center">How to Use CloudQA Test Data Generator</h2>
          <ol className="list-decimal list-outside space-y-4 text-lg text-muted-foreground pl-6">
            <li>
              <span className="font-semibold text-foreground">Define Your Fields:</span> Start by adding rows for each piece of data you need. Give each field a clear name, like "user_email" or "product_id".
            </li>
            <li>
              <span className="font-semibold text-foreground">Select Data Types:</span> For each field, choose a data type from our extensive list. Whether you need a `FullName`, an `IPv4Address`, or a `CreditCardNumber`, our AI understands the context.
            </li>
            <li>
              <span className="font-semibold text-foreground">Set the Quantity:</span> Specify the number of records you want to generate, from a single row up to 10,000 records for bulk testing.
            </li>
            <li>
              <span className="font-semibold text-foreground">Generate & Preview:</span> Click the "Generate Data" button. Our AI engine will create the data, which you can immediately preview in a clean table format.
            </li>
            <li>
              <span className="font-semibold text-foreground">Download Your Data:</span> Once you're satisfied, export the data in your preferred format. We support JSON, CSV, XML, SQL, Excel, and more.
            </li>
          </ol>
        </section>

        <section id="why-important" className="space-y-6">
          <h2 className="text-3xl font-headline font-semibold text-foreground text-center">Why is a Test Data Generator Important?</h2>
          <ul className="list-disc list-outside space-y-3 text-lg text-muted-foreground pl-6">
              <li><span className="font-semibold text-foreground">Enhanced Test Coverage:</span> Generate varied and specific data to test edge cases and scenarios that real data might not cover.</li>
              <li><span className="font-semibold text-foreground">Massive Time Savings:</span> Instantly create thousands of records, eliminating the tedious and error-prone process of manual data entry.</li>
              <li><span className="font-semibold text-foreground">Data Privacy & Security:</span> Test with realistic but completely anonymous data. This avoids the security risks and legal complications (like GDPR) of using real customer information.</li>
              <li><span className="font-semibold text-foreground">AI-Powered Realism:</span> Our generator ensures logical consistency between fields (e.g., city, state, and country match), making your tests more reliable.</li>
              <li><span className="font-semibold text-foreground">Reproducibility:</span> Generate consistent datasets for reliable, repeatable tests across different environments and development stages.</li>
          </ul>
        </section>
        
        <section id="use-cases" className="space-y-6">
          <h2 className="text-3xl font-headline font-semibold text-foreground text-center">Use Cases for Test Data in Webpage Testing</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 list-disc list-outside text-lg text-muted-foreground pl-6">
            <li>Form validation and submission flows.</li>
            <li>Database performance and load testing.</li>
            <li>UI/UX testing with varying data lengths.</li>
            <li>Testing pagination and data filtering.</li>
            <li>User registration and authentication flows.</li>
            <li>Localization and internationalization testing.</li>
            <li>API endpoint and integration testing.</li>
            <li>Performance benchmarks.</li>
          </ul>
        </section>

        <section id="faq" className="space-y-8">
          <h2 className="text-3xl font-headline font-semibold text-foreground text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-xl text-left font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

      </div>
    </div>
  )
}
