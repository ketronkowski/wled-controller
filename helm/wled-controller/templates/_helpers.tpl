{{/*
Expand the name of the chart.
*/}}
{{- define "wled-controller.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "wled-controller.fullname" -}}
{{- printf "%s" (include "wled-controller.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "wled-controller.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "wled-controller.backendSelectorLabels" -}}
app.kubernetes.io/name: {{ include "wled-controller.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "wled-controller.frontendSelectorLabels" -}}
app.kubernetes.io/name: {{ include "wled-controller.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Discovery selector labels
*/}}
{{- define "wled-controller.discoverySelectorLabels" -}}
app.kubernetes.io/name: {{ include "wled-controller.name" . }}-discovery
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
