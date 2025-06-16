// File: src/components/MatchResults.tsx

import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
} from "@mui/material";
import type { EnhancedMatch } from "@/lib/types";

interface MatchResultsProps {
  matches: EnhancedMatch[];
  loading: boolean;
  error?: string;
}

export default function MatchResults({
  matches,
  loading,
  error,
}: MatchResultsProps) {
  if (loading) {
    return (
      <Box textAlign="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
        {error}
      </Typography>
    );
  }
  if (matches.length === 0) {
    return (
      <Typography sx={{ mt: 2, textAlign: "center" }}>
        No matches found.
      </Typography>
    );
  }

  return (
    <List>
      {matches.map((m) => (
        <React.Fragment key={m.id}>
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={m.title}
              secondary={
                m.type === "room"
                  ? `$${m.price}/mo — ${m.description.slice(0, 80)}…`
                  : `Roommate — ${m.description.slice(0, 80)}…`
              }
            />
          </ListItem>
          <Divider component="li" />
        </React.Fragment>
      ))}
    </List>
  );
}
