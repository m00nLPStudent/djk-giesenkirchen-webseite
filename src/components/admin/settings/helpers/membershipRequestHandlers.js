import {
  forwardMembershipRequest,
  saveMembershipRequestStatus,
} from "@/lib/membership/membership.service";
import { createInitialMembershipRequestForm } from "./settingsInitialState";
import { createMembershipForwardPayload } from "./settingsPayload";

export function createMembershipRequestHandlers({
  router,
  selectedMembershipRequest,
  membershipRequestForm,
  forwardingTargets,
  setMembershipRequests,
  setSelectedMembershipRequestId,
  setMembershipRequestForm,
  setMembershipRequestLoading,
}) {
  function updateMembershipRequestField(field, value) {
    setMembershipRequestForm((current) => {
      if (field === "forwarded_to_type") {
        return {
          ...current,
          forwarded_to_type: value,
          forwarded_to_id: "",
        };
      }

      return { ...current, [field]: value };
    });
  }

  function selectMembershipRequest(item) {
    setSelectedMembershipRequestId(item?.id || null);
    setMembershipRequestForm(createInitialMembershipRequestForm(item));
  }

  async function handleMembershipRequestSave(event) {
    event.preventDefault();
    if (!selectedMembershipRequest) return;

    setMembershipRequestLoading(true);
    const result = await saveMembershipRequestStatus(
      selectedMembershipRequest,
      membershipRequestForm,
    );
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern der Anfrage.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Anfrage wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage gespeichert.");
    router.refresh();
  }

  async function markMembershipRequestDone() {
    if (!selectedMembershipRequest) return;

    setMembershipRequestLoading(true);
    const result = await saveMembershipRequestStatus(
      selectedMembershipRequest,
      {
        ...membershipRequestForm,
        status: "done",
      },
    );
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(result.error.message || "Status konnte nicht aktualisiert werden.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Status wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage als erledigt markiert.");
    router.refresh();
  }

  async function handleMembershipRequestForward() {
    if (!selectedMembershipRequest) return;

    if (!membershipRequestForm.forwarded_to_type) {
      alert("Bitte zuerst Trainer oder Vorstand auswählen.");
      return;
    }

    if (!membershipRequestForm.forwarded_to_id) {
      alert("Bitte eine Person für die Weiterleitung auswählen.");
      return;
    }

    const selectedTarget = forwardingTargets.find(
      (item) =>
        String(item.id) === String(membershipRequestForm.forwarded_to_id),
    );

    if (!selectedTarget) {
      alert("Die ausgewählte Person konnte nicht geladen werden.");
      return;
    }

    setMembershipRequestLoading(true);
    const result = await forwardMembershipRequest(
      selectedMembershipRequest,
      createMembershipForwardPayload(membershipRequestForm, selectedTarget),
    );
    setMembershipRequestLoading(false);

    if (result.error) {
      alert(
        result.error.message ||
          "Weiterleitung konnte nicht gespeichert werden.",
      );
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Weiterleitung wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRequests((current) =>
      current.map((item) => (item.id === saved.id ? saved : item)),
    );
    selectMembershipRequest(saved);
    alert("Anfrage weitergeleitet.");
    router.refresh();
  }

  return {
    updateMembershipRequestField,
    selectMembershipRequest,
    handleMembershipRequestSave,
    markMembershipRequestDone,
    handleMembershipRequestForward,
  };
}
