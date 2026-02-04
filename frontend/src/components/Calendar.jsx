import React, { useState } from 'react';

const Calendar = ({ events = [], onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Generate Calendar Grid
    const renderCalendarDays = () => {
        const days = [];
        const today = new Date();

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty bg-light border-end border-bottom"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Find events for this day
            const dayEvents = events.filter(e => {
                const eventDate = new Date(e.date);
                return eventDate.getDate() === day &&
                    eventDate.getMonth() === month &&
                    eventDate.getFullYear() === year;
            });

            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasEvents = dayEvents.length > 0;

            days.push(
                <div
                    key={day}
                    className={`calendar-day border-end border-bottom position-relative p-2 ${isToday ? 'bg-primary bg-opacity-10' : ''} ${hasEvents ? 'bg-info bg-opacity-10 cursor-pointer' : ''}`}
                    style={{ height: '100px', cursor: hasEvents ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    onClick={() => hasEvents && onDateClick && onDateClick(new Date(year, month, day), dayEvents)}
                    onMouseEnter={(e) => hasEvents && e.currentTarget.classList.add('bg-light')}
                    onMouseLeave={(e) => !isToday && !hasEvents && e.currentTarget.classList.remove('bg-light')}
                >
                    <span className={`fw-bold small ${isToday ? 'text-primary' : 'text-muted'}`}>{day}</span>

                    {/* Event Indicators */}
                    <div className="mt-1 d-flex flex-column gap-1">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                            <div
                                key={idx}
                                className={`badge text-truncate w-100 ${ev.type === 'visit' ? 'bg-success text-white' : 'bg-info text-dark'}`}
                                style={{ fontSize: '0.7rem' }}
                                title={ev.title}
                            >
                                {ev.title || 'Event'}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="badge bg-secondary text-white" style={{ fontSize: '0.6rem' }}>
                                +{dayEvents.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h5>
                <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" onClick={handlePrevMonth}><i className="bi bi-chevron-left"></i></button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleToday}>Today</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleNextMonth}><i className="bi bi-chevron-right"></i></button>
                </div>
            </div>
            <div className="card-body p-0">
                {/* Weekday Headers */}
                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-2 small fw-bold text-muted border-bottom bg-light">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
