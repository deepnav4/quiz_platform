export default function OptionList({ options, selected = [], onSelect, disabled = false, correctIds = [] }) {
  const showCorrect = correctIds.length > 0;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {options?.map(o => {
        const isSelected = selected.includes(o.id);
        let bg = isSelected ? '#cce5ff' : '#f8f8f8';
        if (showCorrect) {
          if (correctIds.includes(o.id)) bg = '#d4edda';
          else if (isSelected) bg = '#f8d7da';
        }
        return (
          <button key={o.id} onClick={() => onSelect && onSelect(o.id)} disabled={disabled}
            style={{ padding: 12, border: `2px solid ${isSelected ? '#007bff' : '#ddd'}`, borderRadius: 6, background: bg, cursor: disabled ? 'default' : 'pointer', textAlign: 'left' }}>
            {o.text}
          </button>
        );
      })}
    </div>
  );
}
