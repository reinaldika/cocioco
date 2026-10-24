import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, Coins, UserRound } from 'lucide-react';
import type { Task } from '../types';
import { money, statusLabel } from '../data';
import Countdown from './Countdown';
export default function TaskCard({ task }: { task: Task }) {
  return <Link to={`/commissions/${task.id}`} className="task-card">
    <div className="task-thumb" style={{ background: task.tone === 'lime' ? '#e6f1b2' : task.tone === 'pink' ? '#fbd7ec' : task.tone === 'purple' ? '#dfd0fa' : task.tone === 'yellow' ? '#fff0ae' : '#ebdfff' }}><img src={task.art} alt="" loading="lazy" /><span className="task-number">{task.id}</span></div>
    <div className="task-body"><div className="task-top"><span className={`status status-${task.status}`}>{statusLabel[task.status]}</span><span className="task-category">{task.category}</span></div>
      <h3>{task.title}</h3><p>{task.description}</p>
      <div className="task-attributes"><span><Coins size={15}/>{money(task.reward)}</span><span><Clock3 size={15}/>{task.durationHours} hours</span></div>
      {task.status === 'in_progress' && <div className="task-assigned"><span><UserRound size={14}/> @{task.assigneeName}</span><Countdown until={task.deadlineAt}/></div>}
      <div className="task-bottom"><span>{task.status === 'available' ? 'View & claim commission' : task.status === 'under_review' ? 'Submission being reviewed' : 'View commission details'}</span><span className="task-bottom-arrow"><ArrowUpRight size={19}/></span></div>
    </div>
  </Link>;
}
