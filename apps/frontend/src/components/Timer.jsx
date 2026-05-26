export default function Timer({ seconds }) {
  const color = seconds <= 5 ? 'red' : seconds <= 10 ? 'orange' : 'inherit';
  return (
    <span style={{ fontWeight: 'bold', fontSize: 24, color }}>
      ⏱ {seconds}s
    </span>
  );
}
