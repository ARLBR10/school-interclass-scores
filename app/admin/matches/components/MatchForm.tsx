import { Sports as SportsTranslations } from "@/app/utils/Translations";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

// Helpers to format/parse `datetime-local` values using local timezone
function formatDateTimeLocal(d?: Date) {
  if (!d) return "";
  // Build YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(v: string) {
  if (!v) return undefined;
  // v is like 'YYYY-MM-DDTHH:mm' in local time — construct Date using components
  const [datePart, timePart] = v.split("T");
  if (!datePart || !timePart) return undefined;
  const [year, month, day] = datePart.split("-").map((s) => parseInt(s, 10));
  const [hour, minute] = timePart.split(":").map((s) => parseInt(s, 10));
  return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0);
}

/* ----------------------------- MatchForm ----------------------------- */
/**
 * Componente reutilizável para criar/editar uma partida.
 * Props:
 * - initial?: dados iniciais (opcional) — deve corresponder ao shape que você usa no backend
 * - onSubmit: callback quando o formulário é enviado (recebe um objeto com os campos)
 *
 * Este componente foca somente na UI/validação básica e delega persistência ao pai.
 */

export function MatchForm({ matchID }: { matchID?: string }) {
  // Queries
  const initial = useQuery(api.matches.get, {
    ID: matchID as any,
  });
  const TeamList = useQuery(api.teams.getAll);
  const Mutation = useMutation(api.matches.createOrEdit);

  // State (controlled form)
  const [teamA, setTeamA] = useState<string>(initial?.teams?.[0] ?? "");
  const [teamB, setTeamB] = useState<string>(initial?.teams?.[1] ?? "");
  const [scheduledData, setScheduledData] = useState<Date | undefined>(
    initial?.scheduledData ? new Date(initial.scheduledData * 1000) : undefined
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "Scheduled");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Keep state in sync when `initial` loads/changes
  useEffect(() => {
    setTeamA(initial?.teams?.[0] ?? "");
    setTeamB(initial?.teams?.[1] ?? "");
    setScheduledData(
      initial?.scheduledData
        ? new Date(initial.scheduledData * 1000)
        : undefined
    );
    setStatus(initial?.status ?? "Scheduled");
  }, [initial]);

  const canSubmit = useMemo(() => {
    if (!teamA || !teamB) return false;
    if (teamA === teamB) return false;
    return true;
  }, [teamA, teamB]);

  async function HandleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      console.log(
        await Mutation({
          MatchID: matchID as any,
          events: [],
          status: status as any,
          teams: [teamA, teamB] as any[],
          scheduledData: Math.floor(scheduledData!.getTime() / 1000),
        })
      );
    } catch (err) {
      // TODO: surface error to UI (left simple for now)
      console.error("Erro ao salvar partida", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={HandleSubmit}
      className="space-y-4 bg-white/5 p-4 rounded-lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-gray-300">Time A</span>
          <select
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="mt-1 block w-full bg-transparent border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="" disabled>
              Selecione um time
            </option>
            {TeamList?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} - {SportsTranslations[t.sport]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-gray-300">Time B</span>
          <select
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="mt-1 block w-full bg-transparent border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="" disabled>
              Selecione um time
            </option>
            {TeamList?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} - {SportsTranslations[t.sport]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-gray-300">
            Data e hora (agendada) (Opcional)
          </span>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(scheduledData)}
            onChange={(e) =>
              setScheduledData(parseDateTimeLocal(e.target.value))
            }
            className="mt-1 block w-full bg-transparent border border-white/10 rounded px-3 py-2 text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-300">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-1 block w-full bg-transparent border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="Scheduled">Agendada</option>
            <option value="Live" disabled>
              Ao vivo
            </option>
            <option value="Finished" disabled>
              Finalizada
            </option>
            <option value="Cancelled">Cancelada</option>
          </select>
        </label>
      </div>
      {/* {error && <p className="text-sm text-red-400">{error}</p>} */}{" "}
      {/* Later */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="bg-white/6 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Salvar partida"}
        </button>
      </div>
    </form>
  );
}
