"""One-off generator: Thilak Kumar resume -> .docx"""
from __future__ import annotations

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor


def set_default_font(doc: Document, name: str = "Calibri", size: Pt = Pt(11)) -> None:
    style = doc.styles["Normal"]
    style.font.name = name
    style.font.size = size


def add_section_title(doc: Document, title: str) -> None:
    p = doc.add_paragraph()
    r = p.add_run(title.upper())
    r.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True


def add_bullets(doc: Document, items: list[str]) -> None:
    for t in items:
        doc.add_paragraph(t, style="List Bullet")


def add_project(
    doc: Document,
    title: str,
    meta: str,
    context: str,
    env: str,
    bullets: list[str],
) -> None:
    h = doc.add_paragraph()
    r = h.add_run(title)
    r.bold = True
    r.font.size = Pt(12)
    doc.add_paragraph(meta)
    p = doc.add_paragraph()
    r1 = p.add_run("Context: ")
    r1.bold = True
    p.add_run(context)
    p2 = doc.add_paragraph()
    r2 = p2.add_run("Environment: ")
    r2.bold = True
    p2.add_run(env)
    add_bullets(doc, bullets)
    doc.add_paragraph()


def main() -> None:
    doc = Document()
    set_default_font(doc)

    title = doc.add_paragraph()
    tr = title.add_run("Thilak Kumar")
    tr.bold = True
    tr.font.size = Pt(22)
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT

    doc.add_paragraph(
        "Indian citizen · Currently based in USA · Relocating to Chennai, India (February 2027)"
    )

    doc.add_paragraph("Email: thilakmemphis@gmail.com")
    doc.add_paragraph("Mobile: +1 (469) 920-7188 (WhatsApp available on request)")
    doc.add_paragraph(
        "LinkedIn: https://www.linkedin.com/in/thilakkumar-rengasamy-b5621220a/"
    )

    add_section_title(doc, "Professional Summary")
    add_bullets(
        doc,
        [
            "10+ years of IT experience across the SDLC using waterfall and Agile methodologies for web application design, development, maintenance, and enhancement.",
            "Strong hands-on experience with Java & JEE web technologies, object-oriented design, database programming, server-side development, UI development, and cloud-based platforms.",
            "Core stack includes Java, JEE (JDBC, Servlets, JSP, EJB, JMS, JNDI), jQuery, REST/JSON web services, Struts, Spring, Hibernate, ORM, XML, HTML5, UML, Apache, Log4j, Ant, Maven, shell scripting, and JavaScript.",
            "Solid experience in Java 8 features including multithreading, Streams, lambdas, and common design patterns.",
            "Presentation-layer development using AngularJS, jQuery, Ajax, Bootstrap, and HTML, including client-side validations.",
            "IDE experience includes IBM RAD, JBoss Developer Studio, Spyder, R Studio, Eclipse, and Spring Tool Suite.",
            "CI/CD exposure with GitLab, GitHub, Jenkins, CVS, SVN, and Ant scripts.",
            "Application servers: JBoss, WebSphere, Apache Tomcat, WebLogic, Glassfish.",
            "Testing: JUnit, Mockito, Selenium; REST security experience with JWT and OAuth-related standards.",
            "Effective communication with stakeholders (business, technical teams, and IT management); self-motivated with strong analytical skills.",
        ],
    )

    add_section_title(doc, "Education")
    doc.add_paragraph(
        "B.E., Electronics and Communication Engineering — Anna University, India"
    )

    add_section_title(doc, "Technical Skills")
    skills = [
        ("Languages", "Java, XML, SQL"),
        ("Methodologies", "Agile, Scrum, TDD"),
        (
            "Web",
            "Servlets, JSP, Struts, SOAP/REST, Swing, JavaBeans, JMS, HTML, JavaScript, jQuery, XML (DOM), JWT",
        ),
        ("Databases / ORM", "Oracle 12, MS SQL Server, JDBC"),
        (
            "Frameworks",
            "MVC, Struts 1.2, Spring, Spring Boot, Spring WS, Spring REST, microservices",
        ),
        ("Operating Systems", "Linux, Unix, Windows, Solaris"),
        ("Tools / IDEs", "Spring Tool Suite, Eclipse, Altova XMLSpy, SQL Developer"),
        ("Servers", "JBoss, Tomcat, Glassfish, WebLogic, WebSphere Liberty"),
        ("Version Control", "GitLab, GitHub, SVN, CVS, Bitbucket"),
        ("Testing", "JUnit, Mockito, Selenium"),
    ]
    for label, text in skills:
        p = doc.add_paragraph()
        lr = p.add_run(f"{label}: ")
        lr.bold = True
        p.add_run(text)

    add_section_title(doc, "Professional Experience")

    add_project(
        doc,
        "Unemployment Insurance Benefits — Kansas Department of Labor",
        "Technical Consultant · Dec 2023 – Present · USA",
        "State unemployment insurance program supporting eligible Kansas workers with temporary wage replacement in line with state law and operational requirements.",
        "Java 8, Spring Boot 2, Oracle 12, DB2 11, Swagger, AWS, Maven, Spring Data, Mockito, JAXB, WebSphere Liberty, Eclipse, GitHub, Jenkins, Altova XMLSpy, SQL Developer, JIRA, Confluence, React, JWT, OAuth, Bootstrap.",
        [
            "Delivered sprint demos to business stakeholders for assigned user stories.",
            "Partnered with product owners on requirements, technical design, architecture discussions, and issue resolution.",
            "Worked with the architecture team on targeted refactors to improve maintainability.",
            "Owned troubleshooting for production issues: investigation, root cause analysis, fixes, and release alignment.",
            "Participated in peer reviews to align implementation with design and performance expectations.",
            "Executed Agile ceremonies (standups, planning, reviews, retros) on a two-week cadence; supported backlog grooming and planning poker.",
            "Implemented microservices using Spring Boot and Spring MVC.",
            "Designed and developed JSON-driven inputs and processing to build operational triggers.",
            "Built a framework to parse JSON and XML payloads for business processing needs.",
            "Developed a jQuery-based dashboard/CMS supporting customer notification workflows.",
            "Applied TDD practices for key application components.",
            "Deployed and scaled services on PCF (Pivotal Cloud Foundry).",
            "Implemented REST/JSON services over a Spring JPA persistence layer.",
            "Used Octane-ALM/JIRA for defect lifecycle and traceability.",
            "Supported CI/CD with Jenkins/Maven and automated testing with Selenium.",
        ],
    )

    add_project(
        doc,
        "Customer Pricing Map (CPM) — FedEx Corporation",
        "Technical Lead · Jun 2018 – Dec 2023 · Collierville, TN, USA",
        "Consolidated pricing data from multiple sources through ETL into Oracle, with Java APIs and a multi-tier architecture to support pricing maps, inheritance models, and complex pricing views across organizational boundaries.",
        "Java 8, Spring Boot 2, Oracle 12, DB2 11, Swagger, PCF, Maven, Spring Data, Mockito, JAXB, WebSphere Liberty, Eclipse, GitHub, Jenkins, Altova XMLSpy, SQL Developer, JIRA, Confluence, React (Hooks), JWT, OAuth, Bootstrap, Node.js.",
        [
            "Delivered sprint demos to business stakeholders; aligned backlog priorities with product owners.",
            "Partnered with architecture on refactors and technical direction for a large pricing platform.",
            "Led troubleshooting and production support for release-tagged incidents (RCA, mitigation, fixes).",
            "Conducted peer reviews to enforce design conformance and performance considerations.",
            "Ran Agile ceremonies (two-week sprints) including grooming and planning poker.",
            "Built microservices using Spring Boot/Spring MVC and REST/JSON integrations with Spring JPA.",
            "Developed React UI using Hooks for complex tabular pricing views and multi-window state management.",
            "Supported a Node.js layer for complex, near real-time Excel export generation; implemented custom queuing/throttling for download workloads.",
            "Developed JSON/XML parsing utilities and integration components supporting pricing workflows.",
            "Developed jQuery-based dashboard/CMS capabilities within the broader notification and operational tooling footprint.",
            "Applied TDD for critical modules; deployed/scaled services on PCF.",
            "Implemented CI/CD with Jenkins/Maven and automated testing with Selenium.",
            "Used Octane-ALM/JIRA for defect tracking and traceability.",
        ],
    )

    add_project(
        doc,
        "Regional Claim System (RCS) — Prudential",
        "Senior Application Developer · Apr 2017 – Jun 2018 · Kuala Lumpur, Malaysia",
        "E-commerce and servicing capabilities for life insurance and wealth management products, including online/offline policy purchase flows and agent-assisted sales through regional claim/servicing systems.",
        "Java 8, Spring, Hibernate, HTML, CSS, Log4j, MS SQL, Ant, JSP, Ajax, jQuery, SVN, Eclipse, MySQL, iReport, SOAP/REST, Tomcat, JWT, OAuth.",
        [
            "Implemented Spring MVC modules and JSP/Bean-based pages with HTML/CSS/JavaScript/jQuery/AJAX.",
            "Prepared technical specifications and unit test plans; supported UAT/integration defect triage.",
            "Collaborated with business partners to clarify requirements and support delivery in Agile sprints.",
            "Applied patterns such as Singleton, Prototype, DAO/DTO layers; supported production activities.",
            "Contributed to QA coordination across SIT/UAT/regression/performance cycles; documented outcomes and risks.",
            "Authored solution/design notes in Confluence for team reference.",
        ],
    )

    add_project(
        doc,
        "Cards Issuance Platform — RuPay",
        "Java Lead · Jan 2016 – Dec 2016 · Chennai, India",
        "Card lifecycle management for debit/credit/loyalty/prepaid and specialized payment cards, including issuance, activation, usage monitoring, and closure on a unified platform.",
        "Java 7, Spring, Hibernate, HTML, CSS, Log4j, MS SQL, Ant, JSP, Ajax, jQuery, SVN, Eclipse, MySQL, iReport, SOAP/REST, WebSphere 8, Bootstrap.",
        [
            "Delivered Spring MVC features with JSP/JavaBeans and UI validations using JavaScript/jQuery/AJAX.",
            "Prepared technical specifications and unit testing artifacts; supported UAT/integration fixes.",
            "Implemented DAO/DTO patterns; supported production support cycles.",
            "Worked in Agile delivery with estimation, documentation, and stakeholder reviews.",
        ],
    )

    add_project(
        doc,
        "PTS-ODC — Bharti AXA",
        "Delivery Software Engineer · Aug 2015 – Jan 2016 · Mumbai, India",
        "E-commerce and policy servicing for life insurance and wealth management products, including online/offline purchase flows and agent-assisted sales.",
        "Java 6, Spring, Hibernate, HTML, CSS, Log4j, MS SQL, Ant, JSP, Ajax, jQuery, SVN, Eclipse, MySQL, iReport, SOAP/REST, Tomcat, Bootstrap.",
        [
            "Implemented Spring MVC modules with JSP/JavaBeans; supported requirements clarification and UAT fixes.",
            "Applied Singleton/Prototype patterns with DAO/DTO layering; contributed to production support.",
            "Participated in Agile ceremonies, estimation, and client-facing documentation/reviews.",
        ],
    )

    add_project(
        doc,
        "Library Management System (Eshelf) — Never Obsolete Limited",
        "Developer · Nov 2012 – Jul 2013 · UK · Team size: 9",
        "Stock maintenance, transaction entry, and reporting for library operations with automated retrieval and borrower management.",
        "JEE 1.5 (Servlets 2.4, Java 5), Struts, JavaScript, HTML, MySQL 5.5, Tomcat.",
        [
            "Contributed across design, coding, reviews, and unit testing; supported requirements analysis with the team lead.",
            "Implemented DAO/DTO patterns; developed UI modules and database design contributions.",
            "Delivered major role-based modules including administrator workflows.",
        ],
    )

    add_project(
        doc,
        "Merit Bay Test Engine — Online Examination System",
        "Developer · Apr 2012 – Nov 2012 · Team size: 5",
        "Post-training skills assessment engine to evaluate employees and capture ratings for performance analysis.",
        "JEE 1.5 (Servlets 2.4, Java 5), JavaScript, MySQL 5.5, Tomcat.",
        [
            "Delivered design, development, and deployment work for the employee performance module using MVC patterns.",
            "Supported requirements analysis with the team lead; performed unit testing for assigned modules.",
        ],
    )

    out = "Thilak_Java_Resume_India_Chennai.docx"
    doc.save(out)
    print(out)


if __name__ == "__main__":
    main()
