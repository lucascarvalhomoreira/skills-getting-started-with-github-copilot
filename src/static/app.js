document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";

      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = "-- Select an activity --";
      activitySelect.appendChild(placeholderOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list"></ul>
            <p class="no-participants hidden">No participants yet</p>
          </div>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        const noParticipants = activityCard.querySelector(".no-participants");

        if (details.participants.length === 0) {
          noParticipants.classList.remove("hidden");
        }

        details.participants.forEach((participant) => {
          const participantItem = document.createElement("li");

          const participantName = document.createElement("span");
          participantName.textContent = participant;

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "participant-delete";
          deleteButton.title = `Unregister ${participant}`;
          deleteButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          deleteButton.textContent = "×";

          deleteButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                await fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "An error occurred";
                messageDiv.className = "error";
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            } catch (error) {
              messageDiv.textContent = "Failed to unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering participant:", error);
            }
          });

          participantItem.append(participantName, deleteButton);
          participantsList.appendChild(participantItem);
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
