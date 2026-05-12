const SkeletonRow = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`${width} ${height} bg-background-elevated rounded animate-pulse`} />
);

export default SkeletonRow;
