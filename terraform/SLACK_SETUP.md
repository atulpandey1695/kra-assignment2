# Slack Integration Setup for CI/CD Dashboard

## 🔧 **How to Get Your Slack Webhook URL**

### **Step 1: Create a Slack App**
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app name: `CI/CD Dashboard`
5. Select your workspace
6. Click **"Create App"**

### **Step 2: Enable Incoming Webhooks**
1. In your app settings, go to **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **ON**
3. Click **"Add New Webhook to Workspace"**
4. Choose the channel where you want notifications (e.g., `#devops`, `#alerts`)
5. Click **"Allow"**

### **Step 3: Copy Webhook URL**
1. Copy the **Webhook URL** (starts with `https://hooks.slack.com/services/...`)
2. This is your `SLACK_WEBHOOK_URL`

## 📝 **Configuration Files to Update**

### **Option 1: Using terraform.tfvars (Recommended)**
Create `terraform/terraform.tfvars`:
```hcl
project_id = "crested-archive-469119-u6"
region     = "us-central1"
zone       = "us-central1-a"
slack_webhook_url = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

### **Option 2: Using Environment Variable**
```bash
export TF_VAR_slack_webhook_url="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
terraform apply
```

### **Option 3: Using Command Line**
```bash
terraform apply -var="slack_webhook_url=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

## 📤 **What Notifications You'll Receive**

### **Deployment Success**
```
🚀 CI/CD Dashboard Deployment Update
Status: ✅ SUCCESS
Dashboard URL: Open Dashboard
API Health: Check API
Message: CI/CD Dashboard deployed successfully with live data! Pipeline count: 10
```

### **Deployment Failure**
```
🚀 CI/CD Dashboard Deployment Update
Status: ❌ FAILED
Dashboard URL: Open Dashboard
API Health: Check API
Message: CI/CD Dashboard deployment failed. Only 2/4 containers running
```

### **Partial Success**
```
🚀 CI/CD Dashboard Deployment Update
Status: ⚠️ PARTIAL SUCCESS
Dashboard URL: Open Dashboard
API Health: Check API
Message: CI/CD Dashboard deployed but no data found. Seeding data...
```

## 🔧 **Testing Your Slack Integration**

### **Test Webhook URL**
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message from CI/CD Dashboard"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### **Test with Terraform**
```bash
# Set your webhook URL
export TF_VAR_slack_webhook_url="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Deploy
terraform apply
```

## 🚨 **Security Best Practices**

1. **Never commit webhook URLs** to version control
2. **Use terraform.tfvars** and add it to `.gitignore`
3. **Mark as sensitive** in Terraform (already done)
4. **Rotate webhook URLs** periodically
5. **Use environment variables** in production

## 📋 **Troubleshooting**

### **No Notifications Received**
1. Check webhook URL is correct
2. Verify Slack app has proper permissions
3. Check if webhook is enabled in Slack app
4. Verify channel permissions

### **Permission Errors**
1. Make sure the Slack app is added to the workspace
2. Check if the bot has permission to post in the channel
3. Verify the webhook URL is active

### **Test Notifications**
```bash
# On the VM, test Slack notification
cd /opt/cicd-dashboard
./slack-notification.sh
```

## 🎯 **Expected Results**

After successful setup:
- ✅ Deployment notifications sent to Slack
- ✅ Dashboard URL included in notifications
- ✅ Real-time status updates
- ✅ Error notifications for failures
- ✅ Success confirmations with metrics

---

**Your Slack integration is now ready! 🚀**
