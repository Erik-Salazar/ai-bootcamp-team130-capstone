const SKELETON_ROWS = 5;

export default function DashboardSkeleton() {
  return (
    <>
      <div className="dashboard-stats" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card stat-card--skeleton">
            <span className="skeleton skeleton--icon" />
            <span className="skeleton skeleton--value" />
            <span className="skeleton skeleton--label" />
          </div>
        ))}
      </div>

      <div className="dashboard-table-wrap dashboard-table-wrap--skeleton" aria-busy="true" aria-label="Loading records">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                {Array.from({ length: 8 }).map((_, i) => (
                  <th key={i}><span className="skeleton skeleton--th" /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }).map((_, row) => (
                <tr key={row}>
                  {Array.from({ length: 8 }).map((_, col) => (
                    <td key={col}><span className="skeleton skeleton--td" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dashboard-table-footer dashboard-table-footer--skeleton">
          <span className="skeleton skeleton--footer" />
          <span className="skeleton skeleton--footer-controls" />
        </div>
      </div>
    </>
  );
}
