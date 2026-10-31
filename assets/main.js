(function () {
  "use strict";
  var cfg = window.SITE_CONFIG || {};
  var doc = document;
  doc.documentElement.classList.add("js");

  /* Year */
  var year = doc.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Contact links from config */
  var emailBtn = doc.getElementById("emailBtn");
  var linkedinBtn = doc.getElementById("linkedinBtn");
  var footerLinkedin = doc.getElementById("footerLinkedin");
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email || "");
  var linkedinOk = /^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(cfg.linkedin || "");

  if (emailBtn && emailOk) { emailBtn.href = "mailto:" + cfg.email; emailBtn.hidden = false; }
  [linkedinBtn, footerLinkedin].forEach(function (a) {
    if (a && linkedinOk) { a.href = cfg.linkedin; a.hidden = false; }
  });

  /* Mobile navigation */
  var toggle = doc.getElementById("navToggle");
  var links = doc.getElementById("navLinks");
  function closeMenu() {
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
    });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") closeMenu(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* Reveal on scroll */
  var revealEls = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Active nav link */
  var navAnchors = Array.prototype.slice.call(doc.querySelectorAll(".nav-links a[href^='#']"));
  var sections = navAnchors.map(function (a) { return doc.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navAnchors.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* Contact form */
  var form = doc.getElementById("contactForm");
  if (!form) return;
  var status = doc.getElementById("formStatus");
  var submitBtn = doc.getElementById("submitBtn");

  function setError(id, msg) {
    var field = doc.getElementById(id);
    var err = doc.getElementById(id + "Error");
    if (err) err.textContent = msg || "";
    if (field) field.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = "form-status" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    var name = doc.getElementById("name").value.trim();
    var email = doc.getElementById("email").value.trim();
    var message = doc.getElementById("message").value.trim();

    var ok = true;
    ok = setError("name", name ? "" : "Please enter your name.") && ok;
    ok = setError("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Please enter a valid email address.") && ok;
    ok = setError("message", message.length >= 10 ? "" : "Please write a message of at least 10 characters.") && ok;
    if (!ok) { var firstBad = form.querySelector("[aria-invalid='true']"); if (firstBad) firstBad.focus(); return; }

    if (doc.getElementById("website").value) { setStatus("Thanks, your message has been sent.", "ok"); form.reset(); return; } /* honeypot */

    if (cfg.formEndpoint) {
      submitBtn.disabled = true;
      setStatus("Sending...");
      fetch(cfg.formEndpoint, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message })
      }).then(function (res) {
        if (!res.ok) throw new Error("bad status");
        setStatus("Thank you. Your message has been sent.", "ok");
        form.reset();
      }).catch(function () {
        setStatus("Sorry, the message could not be sent. Please try again" + (emailOk ? " or email me directly." : " later."), "bad");
      }).then(function () { submitBtn.disabled = false; });
      return;
    }

    if (emailOk) {
      var subject = encodeURIComponent("Portfolio enquiry from " + name);
      var body = encodeURIComponent(message + "\n\nName: " + name + "\nReply to: " + email);
      window.location.href = "mailto:" + cfg.email + "?subject=" + subject + "&body=" + body;
      setStatus("Your email app should open with the message ready to send.", "ok");
      return;
    }

    setStatus("The contact form is not connected yet. Please try again later.", "bad");
  });
})();
