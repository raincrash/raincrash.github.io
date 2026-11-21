// Contact form: validate, then send via Formspree (JSON) or fall back to mailto.
(function () {
  var form = document.getElementById("contact");
  if (!form) return;
  var field = function (n) { return form.elements[n]; }; // form.name is the form's own name
  var status = form.querySelector(".contact-form__status");
  var button = form.querySelector(".contact-form__send");

  function say(text, kind) {
    status.textContent = text;
    status.dataset.kind = kind || "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      say("Please fill in your name, a valid email and a message.", "error");
      var bad = form.querySelector(":invalid");
      if (bad) bad.focus();
      return;
    }

    var name = field("name").value.trim();
    var subject = form.dataset.prefix + " Message from " + name;
    field("_subject").value = subject;

    // Not configured yet: open the visitor's mail app instead.
    if (!form.getAttribute("action")) {
      var body = field("message").value + "\n\n— " + name + " <" + field("email").value + ">";
      location.href = "mailto:" + form.dataset.mailto +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      say("Opening your email app…");
      return;
    }

    button.disabled = true;
    say("Sending…");
    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) {
            // Formspree explains what went wrong, e.g. {"errors":[{"message":"..."}]}
            var msg = data.errors && data.errors.map(function (x) { return x.message; }).join(" ");
            throw new Error(msg || "");
          }
        });
      })
      .then(function () {
        form.reset();
        say("Thanks, your message is on its way.", "ok");
      })
      .catch(function (err) {
        say((err.message ? err.message + " " : "Couldn't send right now. ") +
            "You can also email me directly.", "error");
      })
      .then(function () { button.disabled = false; });
  });
})();
