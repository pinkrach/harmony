import { Link } from 'react-router-dom'
import { ClipboardList, Flame, ShoppingCart, Trophy, Wallet } from 'lucide-react'
import { Pip } from '../components/Pip'
import { Avatar, Chip, PageHead } from '../components/ui'
import { roommates } from '../data'

const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Home() {
  return (
    <>
      <PageHead title="Hey, Natalie!" sub="Casa Girasol" />

      <div className="home-grid">
        <div className="stack" style={{ gap: 18 }}>
          <div className="hero pop">
            <span className="spark" style={{ width: 90, height: 90, right: -20, top: -30 }} />
            <span className="spark" style={{ width: 40, height: 40, right: 70, bottom: -14, animationDelay: '1s' }} />
            <div className="grow" style={{ position: 'relative' }}>
              <h2>2 things to do today</h2>
              <p>You’re so close to a 6-day streak!</p>
              <Link to="/app/chores" className="btn sm">Let’s go</Link>
            </div>
            <Pip size={96} mood="cheer" wave float />
          </div>

          <div className="tiles">
            <Link to="/app/chores" className="tile mint pop" style={{ '--i': 1 } as React.CSSProperties}><ClipboardList aria-hidden /><b>2</b><span>chores left</span></Link>
            <Link to="/app/payments" className="tile sky pop" style={{ '--i': 2 } as React.CSSProperties}><Wallet aria-hidden /><b>$50</b><span>to pay</span></Link>
            <Link to="/app/shopping" className="tile pink pop" style={{ '--i': 3 } as React.CSSProperties}><ShoppingCart aria-hidden /><b>5</b><span>to buy</span></Link>
          </div>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <section className="pop" style={{ '--i': 2 } as React.CSSProperties}>
            <div className="section-head"><h2>Who’s home</h2><Link to="/app/calendar" className="link">Schedule</Link></div>
            <div className="card flat who-home">
              {roommates.map((r) => (
                <div className="p" key={r.id}>
                  <Avatar id={r.id} size={52} home={r.home} />
                  {r.name}
                </div>
              ))}
            </div>
          </section>

          <section className="card pop" style={{ '--i': 3 } as React.CSSProperties}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <b className="card-title row"><Flame color="#ff9f1c" fill="#ff9f1c" aria-hidden /> 5-day streak</b>
              <Chip tone="yellow"><Trophy size={14} aria-hidden /> Sofi is MVP</Chip>
            </div>
            <div className="week">
              {week.map((d, i) => (
                <div className="d" key={i}>
                  <span className={`f${i < 5 ? ' on' : ''}${i === 4 ? ' today' : ''}`}>{i < 5 && <Flame size={18} fill="currentColor" aria-hidden />}</span>
                  {d}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
