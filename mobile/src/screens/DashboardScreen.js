import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";

export default function DashboardScreen() {
  const [farmerStats, setFarmerStats] = useState(null);
  const [plantationStats, setPlantationStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      api.get("/dashboard/farmers").then((res) => setFarmerStats(res.data.data));
      api.get("/dashboard/plantations").then((res) => setPlantationStats(res.data.data));
    }, []),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statRow}>
        <StatCard label="Total Farmers" value={farmerStats?.totalFarmers ?? "-"} />
        <StatCard label="Active" value={farmerStats?.activeFarmers ?? "-"} />
        <StatCard label="New (30d)" value={farmerStats?.recentlyAddedFarmers ?? "-"} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="Total Plantations" value={plantationStats?.totalPlantations ?? "-"} />
        <StatCard label="Total Area" value={plantationStats?.totalArea ?? "-"} />
      </View>

      <Text style={styles.section}>Farmers by District</Text>
      <FlatList
        data={farmerStats?.districtWise || []}
        keyExtractor={(item, i) => `${item.district}-${i}`}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <Text>{item.district}</Text>
            <Text style={styles.bold}>{item.count}</Text>
          </View>
        )}
      />

      <Text style={styles.section}>Plantation Types</Text>
      <FlatList
        data={plantationStats?.typeDistribution || []}
        keyExtractor={(item, i) => `${item.type}-${i}`}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <Text>{item.type}</Text>
            <Text style={styles.bold}>{item.count}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3" },
  title: { fontSize: 22, fontWeight: "700", color: "#1f2a1f", marginBottom: 12 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 14, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#2f6d3c" },
  statLabel: { fontSize: 11, color: "#667", marginTop: 4, textAlign: "center" },
  section: { fontSize: 15, fontWeight: "700", color: "#2f6d3c", marginTop: 18, marginBottom: 6 },
  listRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 10, borderRadius: 6, marginBottom: 4 },
  bold: { fontWeight: "700" },
});
