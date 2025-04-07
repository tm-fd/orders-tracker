// src/components/TrainingSessions.tsx
import moment from 'moment';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

interface TrainingSession {
  id: number;
  user_id: number;
  session_number: number;
  session_duration: number;
  start_time: string;
  type: string;
  streamingSource: string;
  speed: number;
  pendlumLength: number;
  offset: number;
  oscillationTime: number;
  deviceId: number;
}

interface TrainingSessionsProps {
  sessions: TrainingSession[];
}

const columns = [
  { key: "session_number", label: "Session" },
  { key: "date", label: "Date" },
  { key: "start_time", label: "Start Time" },
  { key: "duration", label: "Duration" },
];

export const TrainingSessions = ({ sessions }: TrainingSessionsProps) => {
  const renderCell = (session: TrainingSession, columnKey: string) => {
    switch (columnKey) {
      case "session_number":
        return session.session_number;
      case "date":
        return moment(session.start_time).format('YYYY-MM-DD');
      case "start_time":
        return moment(session.start_time).format('HH:mm:ss');
      case "duration":
        return `${Math.floor(session.session_duration / 60)}m ${session.session_duration % 60}s`;
      default:
        return null;
    }
  };

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <Table
        aria-label="Training sessions table"
        className="min-w-full"
        isStriped
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={sessions} emptyContent={"No training sessions found."}>
          {(session) => (
            <TableRow key={session.id}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(session, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};