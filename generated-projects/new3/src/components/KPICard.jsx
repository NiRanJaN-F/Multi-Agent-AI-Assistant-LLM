import React from 'react';
import PropTypes from 'prop-types';

/**
 * KPI Card component
 *
 * Props:
 * - title (string): The KPI title.
 * - value (string|number): The KPI value.
 * - change (number): Percentage change from previous period.
 * - icon (React element): Optional icon component.
 * - color (string): Border and icon color (default: '#4a90e2').
 * - onClick (function): Optional click handler for the card.
 */
const KPICard = ({
  title,
  value,
  change,
  icon: Icon,
  color = '#4a90e2',
  onClick,
}) => {
  const changeClass =
    change > 0
      ? 'kpi-change-positive'
      : change < 0
      ? 'kpi-change-negative'
      : 'kpi-change-neutral';
  const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className="kpi-card"
      style={{ borderColor: color }}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={handleKeyPress}
    >
      {Icon && (
        <div className="kpi-icon" style={{ color }}>
          {Icon}
        </div>
      )}
      <div className="kpi-content">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        <div className={`kpi-change ${changeClass}`}>
          {arrow} {Math.abs(change)}%
        </div>
      </div>
    </div>
  );
};

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number.isRequired,
  icon: PropTypes.element,
  color: PropTypes.string,
  onClick: PropTypes.func,
};

export default React.memo(KPICard);