import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, statusLed, phosphorHeading } from '../styles/retro';
import { staggerContainer, staggerItem, fadeIn } from '../styles/motion';

const RETRO_GROUP_COLORS = [
  '#FFB800', // amber
  '#00D4AA', // teal
  '#FF6B6B', // coral
  '#88C999', // sage
  '#CD7F32', // copper
  '#B8A8D0', // lavender
  '#F4A460', // sandy
  '#6BC5D2', // cyan
];

export function ParticipantsView() {
  const { currentUser, currentSession, subgroups, fetchSubgroups } = useDeliberationStore();

  useEffect(() => {
    fetchSubgroups();
  }, []);

  if (!currentSession) return null;

  const totalParticipants = subgroups.reduce((sum, sg) => sum + (sg.members?.length || 0), 0);

  return (
    <motion.div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
      }}
      {...fadeIn}
    >
      {/* Section label */}
      <div style={systemLabel}>[ CREW MANIFEST ]</div>

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <h2
          style={{
            ...phosphorHeading,
            fontSize: '22px',
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          PERSONNEL ROSTER
        </h2>
        <span
          style={{
            fontFamily: FONTS.MONO,
            fontSize: '11px',
            color: COLORS.TEXT_MUTED,
            letterSpacing: '1px',
          }}
        >
          {subgroups.length} THINKTANKS &middot; {totalParticipants} PERSONNEL
        </span>
      </div>

      {subgroups.length === 0 ? (
        <div
          style={{
            ...instrumentCard,
            padding: '40px',
            textAlign: 'center' as const,
            fontFamily: FONTS.MONO,
            fontSize: '13px',
            color: COLORS.TEXT_MUTED,
          }}
        >
          ThinkTanks will appear here once the deliberation starts.
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
          }}
        >
          {subgroups.map((sg, i) => {
            const groupColor = RETRO_GROUP_COLORS[i % RETRO_GROUP_COLORS.length];
            const isMyGroup = sg.id === currentUser?.subgroup_id;
            const memberCount = sg.members?.length || 0;

            return (
              <motion.div key={sg.id} variants={staggerItem}>
                {/* Group section header */}
                <div
                  style={{
                    ...systemLabel,
                    color: groupColor,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>[ GROUP {i + 1} ]</span>
                  <span style={{ color: COLORS.TEXT_MUTED, fontSize: '10px' }}>
                    &mdash; {sg.label}
                  </span>
                  {isMyGroup && (
                    <span
                      style={{
                        fontFamily: FONTS.MONO,
                        fontSize: '9px',
                        color: COLORS.ACCENT,
                        letterSpacing: '1px',
                        border: `1px solid ${COLORS.ACCENT_DIM}`,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        background: COLORS.ACCENT_GLOW,
                      }}
                    >
                      YOUR GROUP
                    </span>
                  )}
                </div>

                {/* Member cards */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '4px',
                  }}
                >
                  {sg.members?.map((member) => {
                    const isYou = member.id === currentUser?.id;

                    return (
                      <div
                        key={member.id}
                        style={{
                          ...instrumentCard,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderLeft: isYou
                            ? `2px solid ${COLORS.ACCENT}`
                            : `2px solid ${COLORS.BORDER}`,
                          ...(isMyGroup
                            ? { boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 8px ${groupColor}10` }
                            : {}),
                        } as React.CSSProperties}
                      >
                        {/* Status LED */}
                        <div style={statusLed(groupColor, isMyGroup)} />

                        {/* Name */}
                        <span
                          style={{
                            fontFamily: FONTS.BODY,
                            fontSize: '14px',
                            fontWeight: 500,
                            color: isYou ? COLORS.TEXT_HEADING : COLORS.TEXT_PRIMARY,
                            flex: 1,
                          }}
                        >
                          {member.display_name}
                        </span>

                        {/* Role/group tag */}
                        <span
                          style={{
                            fontFamily: FONTS.MONO,
                            fontSize: '10px',
                            color: COLORS.TEXT_MUTED,
                            letterSpacing: '1px',
                            textTransform: 'uppercase' as const,
                          }}
                        >
                          {sg.label}
                        </span>

                        {/* "YOU" badge */}
                        {isYou && (
                          <span
                            style={{
                              fontFamily: FONTS.MONO,
                              fontSize: '9px',
                              fontWeight: 600,
                              color: COLORS.ACCENT,
                              letterSpacing: '1px',
                              border: `1px solid ${COLORS.ACCENT_DIM}`,
                              padding: '1px 6px',
                              borderRadius: '2px',
                              background: COLORS.ACCENT_GLOW,
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty group state */}
                  {memberCount === 0 && (
                    <div
                      style={{
                        ...instrumentCard,
                        padding: '12px 14px',
                        fontFamily: FONTS.MONO,
                        fontSize: '11px',
                        color: COLORS.TEXT_MUTED,
                      }}
                    >
                      No personnel assigned
                    </div>
                  )}
                </div>

                {/* Group count readout */}
                <div
                  style={{
                    fontFamily: FONTS.MONO,
                    fontSize: '10px',
                    color: COLORS.TEXT_MUTED,
                    marginTop: '4px',
                    textAlign: 'right' as const,
                    letterSpacing: '1px',
                  }}
                >
                  {memberCount} MEMBER{memberCount !== 1 ? 'S' : ''} ASSIGNED
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
