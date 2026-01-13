import './globals.css';

export const metadata = {
    title: 'Daily Zip - Number Logic Puzzle',
    description: 'Connect numbers in order to fill the grid. A new challenge every day.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <main className="container">
                    {children}
                </main>
            </body>
        </html>
    );
}
