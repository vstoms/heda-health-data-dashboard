import { motion, type Variants } from "framer-motion";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const groupVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: "backOut" },
    },
  };

  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.1, ease: "easeInOut" },
    },
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2048 2048"
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <title>Heda Logo</title>
      <defs>
        <linearGradient
          id="mainGradient"
          x1="354.85"
          x2="1693.15"
          y1="350.69"
          y2="1688.99"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8a5dfa" />
          <stop offset="100%" stopColor="#292163" />
        </linearGradient>
        <linearGradient
          id="mirroredGradient"
          x1="1693.15"
          x2="354.85"
          y1="350.69"
          y2="1688.99"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8a5dfa" />
          <stop offset="100%" stopColor="#292163" />
        </linearGradient>
      </defs>
      <g transform="matrix(1.53 0 0 1.53 -543.036 -536.669)">
        <motion.g variants={groupVariants}>
          {/* Layer 1 Nodes */}
          <motion.circle
            variants={itemVariants}
            cx="786.082"
            cy="510.731"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="525.871"
            cy="615.646"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="448.608"
            cy="865.384"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="681.591"
            cy="782.225"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="1024"
            cy="676.335"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="1024"
            cy="972.89"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="1024"
            cy="1252.479"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="820"
            cy="1073.051"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="550"
            cy="1111.949"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="735"
            cy="1301.949"
            r="64.5"
            fill="url(#mainGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="1024"
            cy="1532.068"
            r="64.5"
            fill="url(#mainGradient)"
          />

          {/* Layer 1 Paths */}
          <motion.path
            variants={pathVariants}
            d="m525.87 615.646 260.212-104.915"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m448.608 865.384 77.263-249.738"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m681.591 782.225 104.49-271.494"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m525.87 615.646 155.721 166.579"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m448.608 865.384 232.983-83.16"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M550 1111.95 448.608 865.383"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M786.082 510.731 1024 676.335"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 1024 676.335"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 131.591-329.725"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M448.608 865.384 820 1073.05"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 270-38.9"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 820 1073.05"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 185 190"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204-396.715"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 1024 972.89"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204-100.16"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m735 1301.95 85-228.9"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m1024 1532.068-289-230.119"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M1024 676.335V972.89"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M1024 972.89v279.589"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204 179.429"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m735 1301.95 289-49.471"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204 459.018"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M1024 1532.068v-279.59"
            stroke="url(#mainGradient)"
            strokeWidth="20"
            fill="none"
          />
        </motion.g>

        {/* Mirrored Layer */}
        <motion.g transform="matrix(-1 0 0 1 2048 0)" variants={groupVariants}>
          <motion.circle
            variants={itemVariants}
            cx="786.082"
            cy="510.731"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="525.871"
            cy="615.646"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="448.608"
            cy="865.384"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="681.591"
            cy="782.225"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="820"
            cy="1073.051"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="550"
            cy="1111.949"
            r="64.5"
            fill="url(#mirroredGradient)"
          />
          <motion.circle
            variants={itemVariants}
            cx="735"
            cy="1301.949"
            r="64.5"
            fill="url(#mirroredGradient)"
          />

          <motion.path
            variants={pathVariants}
            d="m525.87 615.646 260.212-104.915"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m448.608 865.384 77.263-249.738"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m681.591 782.225 104.49-271.494"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m525.87 615.646 155.721 166.579"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m448.608 865.384 232.983-83.16"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M550 1111.95 448.608 865.383"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M786.082 510.731 1024 676.335"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 1024 676.335"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 131.591-329.725"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M448.608 865.384 820 1073.05"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 270-38.9"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 820 1073.05"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m550 1111.95 185 190"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204-396.715"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="M681.591 782.225 1024 972.89"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204-100.16"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m735 1301.95 85-228.9"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m1024 1532.068-289-230.119"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204 179.429"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m735 1301.95 289-49.471"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
          <motion.path
            variants={pathVariants}
            d="m820 1073.05 204 459.018"
            stroke="url(#mirroredGradient)"
            strokeWidth="20"
            fill="none"
          />
        </motion.g>
      </g>
    </motion.svg>
  );
}
