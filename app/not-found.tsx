import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="app-fallback">
      <div className="app-fallback__content">
        <p className="app-fallback__eyebrow">Epic MusicSpace</p>
        <h1 className="app-fallback__title">This part of the city is not open yet.</h1>
        <p className="app-fallback__copy">
          Head back to the city map and choose an active district, building, or interior.
        </p>
        <Link className="primary-button app-fallback__link app-fallback__link--primary" href="/">
          Return to the city
        </Link>
      </div>
    </main>
  );
}
